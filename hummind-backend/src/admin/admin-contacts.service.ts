import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ContactKind,
  ContactStatus,
  EntityRole,
  EntityType,
  PlatformRole,
  Prisma,
  UserStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { paginate, toPaginatedResult } from '../common/query.helpers';
import { generateTempPassword } from '../common/temp-password';
import { AuditAction, AuditLogService } from './audit-log.service';
import type {
  ListContactsQueryDto,
  UpdateContactStatusDto,
} from './admin-contacts.dto';

@Injectable()
export class AdminContactsService {
  private readonly logger = new Logger(AdminContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly audit: AuditLogService,
  ) {}

  // ---------------------------------------------------------------------------
  // Read operations
  // ---------------------------------------------------------------------------

  async list(query: ListContactsQueryDto) {
    const where: Prisma.ContactMessageWhereInput = {};
    if (query.status) where.status = query.status as ContactStatus;
    if (query.kind) where.kind = query.kind as ContactKind;
    if (query.search) {
      const term = query.search.trim();
      if (term.length > 0) {
        where.OR = [
          { email: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
          { organizationName: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    const { skip, take } = paginate({ page: query.page, pageSize: query.pageSize });

    const [data, total] = await this.prisma.$transaction([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return toPaginatedResult(data, total, {
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Contact introuvable');
    return row;
  }

  async statsByStatus() {
    const grouped = await this.prisma.contactMessage.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const result: Record<ContactStatus, number> = {
      NEW: 0,
      CONTACTED: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      ARCHIVED: 0,
    };
    for (const row of grouped) {
      result[row.status] = row._count._all;
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // ROOT pipeline — 3 actions on a ContactMessage
  // ---------------------------------------------------------------------------

  /**
   * Marque le contact comme CONTACTED (note interne pour l'équipe ROOT).
   * Pas d'email envoyé au lead à ce stade.
   */
  async markContacted(args: { id: string; actorId: string }) {
    const contact = await this.findOne(args.id);
    if (contact.status === ContactStatus.ACCEPTED ||
        contact.status === ContactStatus.REJECTED) {
      throw new BadRequestException(
        'Ce contact a déjà été clôturé, impossible de le rouvrir.',
      );
    }

    const updated = await this.prisma.contactMessage.update({
      where: { id: args.id },
      data: { status: ContactStatus.CONTACTED },
    });

    void this.audit.record({
      actorId: args.actorId,
      action: AuditAction.CONTACT_CONTACTED,
      targetType: 'contact',
      targetId: args.id,
      payload: { from: contact.status, to: ContactStatus.CONTACTED },
    });

    return updated;
  }

  /**
   * Refuse une demande : passe en REJECTED + envoie un email poli au lead.
   */
  async reject(args: { id: string; actorId: string }) {
    const contact = await this.findOne(args.id);
    if (contact.status === ContactStatus.ACCEPTED) {
      throw new BadRequestException(
        'Impossible de refuser un contact déjà accepté.',
      );
    }

    const updated = await this.prisma.contactMessage.update({
      where: { id: args.id },
      data: { status: ContactStatus.REJECTED },
    });

    void this.mail.sendContactRejected({
      to: contact.email,
      firstname: contact.name?.split(' ')[0] ?? '',
      organizationName: contact.organizationName,
    });

    void this.audit.record({
      actorId: args.actorId,
      action: AuditAction.CONTACT_REJECTED,
      targetType: 'contact',
      targetId: args.id,
      payload: { from: contact.status, to: ContactStatus.REJECTED },
    });

    return updated;
  }

  /**
   * Accepte une demande institution :
   * - crée un User (INVITED, mustChangePassword=true) avec mdp temp argon2
   * - crée une Entity ORGANISATION
   * - crée l'EntityMember OWNER
   * - met le ContactMessage en ACCEPTED + lie le User créé
   * - envoie un email "Bienvenue chez Hummind" avec identifiants
   * - audit log
   * Le tout dans une transaction Prisma : si l'email échoue, la
   * création reste valide (l'email étant async via la queue, BullMQ
   * retry).
   */
  async accept(args: { id: string; actorId: string }): Promise<{
    contact: Prisma.ContactMessageGetPayload<true>;
    user: { id: string; email: string };
    entity: { id: string; name: string };
  }> {
    const contact = await this.findOne(args.id);

    if (contact.status === ContactStatus.ACCEPTED) {
      throw new BadRequestException(
        'Ce contact a déjà été accepté.',
      );
    }
    if (contact.status === ContactStatus.REJECTED) {
      throw new BadRequestException(
        'Ce contact a été refusé. Archivez-le et créez-en un nouveau si nécessaire.',
      );
    }

    const email = contact.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      throw new BadRequestException(
        `Un compte existe déjà pour l'adresse ${email}. Ajoutez plutôt une nouvelle organisation à ce compte.`,
      );
    }

    const tempPassword = generateTempPassword(12);
    const passwordHash = await argon2.hash(tempPassword);

    const firstname =
      contact.name?.trim().split(/\s+/)[0] || 'Bienvenue';
    const lastname = contact.name
      ? contact.name.trim().split(/\s+/).slice(1).join(' ') || 'Hummind'
      : 'Hummind';
    const organizationName =
      contact.organizationName?.trim() || `Organisation de ${firstname}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          firstname,
          lastname,
          passwordHash,
          platformRole: PlatformRole.MEMBER,
          status: UserStatus.INVITED,
          mustChangePassword: true,
          emailVerifiedAt: new Date(), // ROOT a déjà validé via le lead
        },
        select: { id: true, email: true, firstname: true },
      });

      const newEntity = await tx.entity.create({
        data: {
          name: organizationName,
          description: contact.organizationName
            ? `Organisation onboardée via demande Hummind`
            : null,
          type: EntityType.ORGANISATION,
          createdById: newUser.id,
        },
        select: { id: true, name: true },
      });

      await tx.entityMember.create({
        data: {
          entityId: newEntity.id,
          userId: newUser.id,
          role: EntityRole.OWNER,
        },
      });

      const updatedContact = await tx.contactMessage.update({
        where: { id: args.id },
        data: {
          status: ContactStatus.ACCEPTED,
          acceptedUserId: newUser.id,
        },
      });

      return { user: newUser, entity: newEntity, contact: updatedContact };
    });

    // Email + audit non-bloquants
    void this.mail.sendAccountCreatedByRoot({
      to: result.user.email,
      firstname: result.user.firstname,
      email: result.user.email,
      tempPassword,
      organizationName: result.entity.name,
    });

    void this.audit.record({
      actorId: args.actorId,
      action: AuditAction.CONTACT_ACCEPTED,
      targetType: 'contact',
      targetId: args.id,
      payload: {
        createdUserId: result.user.id,
        createdEntityId: result.entity.id,
      },
    });

    void this.audit.record({
      actorId: args.actorId,
      action: AuditAction.USER_CREATED_BY_ROOT,
      targetType: 'user',
      targetId: result.user.id,
      payload: { sourceContactId: args.id, entityId: result.entity.id },
    });

    return {
      contact: result.contact,
      user: { id: result.user.id, email: result.user.email },
      entity: result.entity,
    };
  }

  // ---------------------------------------------------------------------------
  // Generic status update (used for the ARCHIVED transition only — all other
  // transitions go through accept/markContacted/reject above with audit + email).
  // ---------------------------------------------------------------------------

  async updateStatus(
    id: string,
    dto: UpdateContactStatusDto,
    actorId: string,
  ) {
    const next = dto.status as ContactStatus;
    if (next === ContactStatus.ACCEPTED) {
      throw new BadRequestException(
        'Utilisez POST /admin/contacts/:id/accept pour accepter un contact.',
      );
    }
    if (next === ContactStatus.REJECTED) {
      throw new BadRequestException(
        'Utilisez POST /admin/contacts/:id/reject pour refuser un contact.',
      );
    }
    if (next === ContactStatus.CONTACTED) {
      return this.markContacted({ id, actorId });
    }

    const contact = await this.findOne(id);
    const updated = await this.prisma.contactMessage.update({
      where: { id },
      data: { status: next },
    });

    if (next === ContactStatus.ARCHIVED) {
      void this.audit.record({
        actorId,
        action: AuditAction.CONTACT_ARCHIVED,
        targetType: 'contact',
        targetId: id,
        payload: { from: contact.status, to: next },
      });
    }

    return updated;
  }
}
