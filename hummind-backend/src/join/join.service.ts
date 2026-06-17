import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  EntityMember,
  EntityRole,
  EntityType,
  PlatformRole,
  PublicJoinLink,
  UserStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { generateJoinCode } from '../common/join-code';
import { generateOtpCode } from '../common/otp';
import { AuditAction, AuditLogService } from '../admin/audit-log.service';
import type {
  CreatePublicJoinLinkDto,
  JoinSignupDto,
  UpdatePublicJoinLinkDto,
  VerifyEmailDto,
} from './join.dto';

const OTP_VALIDITY_MINUTES = 120; // 2h validés par le user
const OTP_MAX_ATTEMPTS = 5;
const MANAGER_ROLES: EntityRole[] = [EntityRole.OWNER, EntityRole.ADMIN];

@Injectable()
export class JoinService {
  private readonly logger = new Logger(JoinService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly audit: AuditLogService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ===========================================================================
  // OWNER side — CRUD links of a salle
  // ===========================================================================

  async createLink(actorId: string, dto: CreatePublicJoinLinkDto): Promise<PublicJoinLink> {
    const entity = await this.prisma.entity.findUnique({
      where: { id: dto.entityId },
      select: { id: true, type: true },
    });
    if (!entity) throw new NotFoundException('Salle introuvable');
    if (entity.type !== EntityType.SALLE) {
      throw new BadRequestException(
        'Un lien public ne peut être attaché qu\'à une salle (Entity type=SALLE).',
      );
    }
    await this.ensureManager(actorId, dto.entityId);

    // Crée un code unique (collision quasi nulle mais on retry par sécurité).
    let code = '';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      code = generateJoinCode(8);
      const exists = await this.prisma.publicJoinLink.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!exists) break;
      if (attempt === 4) {
        throw new Error('Impossible de générer un code de lien unique');
      }
    }

    const link = await this.prisma.publicJoinLink.create({
      data: {
        code,
        entityId: dto.entityId,
        createdById: actorId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        maxUses: dto.maxUses ?? null,
        enabled: true,
      },
    });

    void this.audit.record({
      actorId,
      action: AuditAction.PUBLIC_JOIN_LINK_TOGGLED,
      targetType: 'publicJoinLink',
      targetId: link.id,
      payload: { event: 'created', entityId: dto.entityId },
    });

    return link;
  }

  async listLinksForEntity(actorId: string, entityId: string): Promise<PublicJoinLink[]> {
    await this.ensureManager(actorId, entityId);
    return this.prisma.publicJoinLink.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLink(actorId: string, linkId: string, dto: UpdatePublicJoinLinkDto): Promise<PublicJoinLink> {
    const link = await this.prisma.publicJoinLink.findUnique({
      where: { id: linkId },
      select: { id: true, entityId: true, enabled: true },
    });
    if (!link) throw new NotFoundException('Lien introuvable');
    await this.ensureManager(actorId, link.entityId);

    const updated = await this.prisma.publicJoinLink.update({
      where: { id: linkId },
      data: {
        enabled: dto.enabled,
        expiresAt:
          dto.expiresAt === null
            ? null
            : dto.expiresAt
              ? new Date(dto.expiresAt)
              : undefined,
        maxUses: dto.maxUses === undefined ? undefined : dto.maxUses,
      },
    });

    if (typeof dto.enabled === 'boolean' && dto.enabled !== link.enabled) {
      void this.audit.record({
        actorId,
        action: AuditAction.PUBLIC_JOIN_LINK_TOGGLED,
        targetType: 'publicJoinLink',
        targetId: link.id,
        payload: { event: dto.enabled ? 'enabled' : 'disabled' },
      });
    }
    return updated;
  }

  async deleteLink(actorId: string, linkId: string): Promise<{ ok: true }> {
    const link = await this.prisma.publicJoinLink.findUnique({
      where: { id: linkId },
      select: { id: true, entityId: true },
    });
    if (!link) throw new NotFoundException('Lien introuvable');
    await this.ensureManager(actorId, link.entityId);
    await this.prisma.publicJoinLink.delete({ where: { id: linkId } });
    return { ok: true };
  }

  // ===========================================================================
  // PUBLIC side — apprenant qui consulte ou rejoint
  // ===========================================================================

  /** Aperçu d'un lien (no auth). Renvoie le nom de la salle + de l'organisation. */
  async getJoinInfo(code: string) {
    const link = await this.findActiveLinkByCode(code);
    const salle = await this.prisma.entity.findUnique({
      where: { id: link.entityId },
      select: {
        id: true,
        name: true,
        parent: { select: { name: true, parent: { select: { name: true } } } },
      },
    });
    if (!salle) throw new NotFoundException('Salle introuvable');

    // L'organisation racine = remonter parent.parent jusqu'à la racine.
    // Pour la v1 on prend simplement le parent direct (probablement un DEPARTEMENT ou ORGANISATION).
    const organisationName =
      salle.parent?.parent?.name ?? salle.parent?.name ?? null;

    return {
      code: link.code,
      salleName: salle.name,
      organisationName,
      remainingUses:
        link.maxUses !== null ? Math.max(0, link.maxUses - link.usedCount) : null,
      expiresAt: link.expiresAt?.toISOString() ?? null,
    };
  }

  /**
   * Inscription apprenant via lien public.
   * - Crée un User (ACTIVE, mustChangePassword=false, emailVerifiedAt=null)
   * - Crée un OTP 6 chiffres envoyé par email (validité 2h)
   * - Crée l'EntityMember (LEARNER)
   * - Incrémente usedCount du PublicJoinLink
   * Renvoie un tempToken (scope=password_change_only NON — distinct) pour
   * que le frontend puisse appeler verifyEmail sans nouveau signin.
   *
   * Pour rester simple en v1, on autorise quand même le user à se connecter
   * normalement après signup (status=ACTIVE), MAIS on garde le statut INVITED
   * sur les emails non vérifiés pour bloquer certains flux ultérieurs si besoin.
   */
  async signupViaCode(code: string, dto: JoinSignupDto): Promise<{
    userId: string;
    email: string;
    requiresEmailVerification: true;
    salleName: string;
  }> {
    const link = await this.findActiveLinkByCode(code);

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'Un compte existe déjà pour cet email. Connectez-vous puis rejoignez la salle.',
      );
    }

    const passwordHash = await argon2.hash(dto.password);
    const otp = generateOtpCode(6);
    const otpHash = await argon2.hash(otp);
    const expiresAt = new Date(Date.now() + OTP_VALIDITY_MINUTES * 60_000);

    const salleName = await this.prisma.entity
      .findUnique({ where: { id: link.entityId }, select: { name: true } })
      .then((s) => s?.name ?? '');

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          firstname: dto.firstname.trim(),
          lastname: dto.lastname.trim(),
          passwordHash,
          platformRole: PlatformRole.MEMBER,
          status: UserStatus.INVITED, // status devient ACTIVE après verify
          mustChangePassword: false,
          emailVerifiedAt: null,
        },
        select: { id: true, email: true, firstname: true },
      });

      await tx.entityMember.create({
        data: {
          userId: user.id,
          entityId: link.entityId,
          role: EntityRole.LEARNER,
        },
      });

      await tx.publicJoinLink.update({
        where: { id: link.id },
        data: { usedCount: { increment: 1 } },
      });

      await tx.emailVerificationCode.create({
        data: {
          userId: user.id,
          codeHash: otpHash,
          expiresAt,
        },
      });

      return user;
    });

    void this.mail.sendEmailVerificationOtp({
      to: result.email,
      firstname: result.firstname,
      code: otp,
      expiresInMinutes: OTP_VALIDITY_MINUTES,
    });

    return {
      userId: result.id,
      email: result.email,
      requiresEmailVerification: true,
      salleName,
    };
  }

  /**
   * Vérifie le code OTP, active le compte et renvoie un JWT classique.
   */
  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        platformRole: true,
        status: true,
        emailVerifiedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Compte introuvable');
    if (user.emailVerifiedAt) {
      throw new BadRequestException("L'email est déjà vérifié.");
    }

    const otp = await this.prisma.emailVerificationCode.findFirst({
      where: { userId: dto.userId, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new BadRequestException('Aucun code en attente, redemandez-en un.');
    if (otp.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Code expiré, redemandez-en un.');
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Trop de tentatives sur ce code. Redemandez-en un.',
      );
    }

    const ok = await argon2.verify(otp.codeHash, dto.code);
    if (!ok) {
      await this.prisma.emailVerificationCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Code incorrect');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: new Date(),
          status: user.status === UserStatus.INVITED ? UserStatus.ACTIVE : user.status,
        },
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          platformRole: true,
        },
      }),
      this.prisma.emailVerificationCode.update({
        where: { id: otp.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    const expiresIn = (this.config.get<string>('JWT_EXPIRES_IN') ??
      '30d') as unknown as number;
    const token = await this.jwt.signAsync(
      {
        sub: updated.id,
        email: updated.email,
        role: updated.platformRole,
      },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn,
      },
    );

    return {
      success: true,
      user: {
        id: updated.id,
        firstname: updated.firstname,
        lastname: updated.lastname,
        email: updated.email,
      },
      token,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '30d',
    };
  }

  /**
   * Utilisateur déjà connecté qui rejoint une salle via lien public.
   * Idempotent : si déjà membre, on retourne { alreadyMember: true }.
   */
  async acceptAsAuthenticated(actorId: string, code: string): Promise<{
    salleId: string;
    salleName: string;
    alreadyMember: boolean;
  }> {
    const link = await this.findActiveLinkByCode(code);
    const salle = await this.prisma.entity.findUnique({
      where: { id: link.entityId },
      select: { id: true, name: true },
    });
    if (!salle) throw new NotFoundException('Salle introuvable');

    const existingMembership = await this.prisma.entityMember.findUnique({
      where: {
        entityId_userId: { entityId: salle.id, userId: actorId },
      },
    });

    if (existingMembership) {
      return { salleId: salle.id, salleName: salle.name, alreadyMember: true };
    }

    await this.prisma.$transaction([
      this.prisma.entityMember.create({
        data: {
          userId: actorId,
          entityId: salle.id,
          role: EntityRole.LEARNER,
        },
      }),
      this.prisma.publicJoinLink.update({
        where: { id: link.id },
        data: { usedCount: { increment: 1 } },
      }),
    ]);

    return { salleId: salle.id, salleName: salle.name, alreadyMember: false };
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private async findActiveLinkByCode(code: string): Promise<PublicJoinLink> {
    const link = await this.prisma.publicJoinLink.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!link) throw new NotFoundException('Lien invalide ou inexistant');
    if (!link.enabled) {
      throw new ForbiddenException('Ce lien a été désactivé.');
    }
    if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) {
      throw new ForbiddenException('Ce lien a expiré.');
    }
    if (link.maxUses !== null && link.usedCount >= link.maxUses) {
      throw new ForbiddenException('Ce lien a atteint son nombre maximum d\'inscriptions.');
    }
    return link;
  }

  private async ensureManager(userId: string, entityId: string): Promise<EntityMember> {
    const member = await this.prisma.entityMember.findUnique({
      where: { entityId_userId: { entityId, userId } },
    });
    if (!member || !MANAGER_ROLES.includes(member.role)) {
      throw new ForbiddenException(
        'Réservé aux gestionnaires (OWNER / ADMIN) de cette salle.',
      );
    }
    return member;
  }
}
