import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

import { AddMemberDto, EntityRoleDto } from './dto/add-member.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { BanMemberDto } from './dto/ban-member.dto';
import {
  EntityRole,
  EntityMemberStatus,
  PlatformRole,
  Prisma,
  UserStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { generateTempPassword } from '../common/temp-password';
import { ConfigService } from '@nestjs/config';
import { add } from 'date-fns';
import { randomUUID } from 'crypto';
import { MailService } from '../mail/mail.service';
import { CreatePublicInvitationLinkDto } from './dto/create-public-invitation-link.dto';
import { RequestJoinViaTokenDto } from './dto/request-join-via-token.dto';

@Injectable()
export class EntityMembersService {
  private static readonly PUBLIC_INVITE_EMAIL = 'public-invite@hummind.local';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cfg: ConfigService,
    private readonly mail: MailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private getInvitationExpiresAt(): Date {
    const raw = this.cfg.get('INVITE_EXPIRES_HOURS') ?? '72';
    const match = String(raw)
      .toLowerCase()
      .trim()
      .match(/^(\d+)(h|d)?$/);

    if (!match) {
      return add(new Date(), { hours: 72 });
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] || 'h';

    if (unit === 'd') {
      return add(new Date(), { days: value });
    }
    return add(new Date(), { hours: value });
  }

  // --- helpers ---
  private async ensureMine(userId: string, entityId: string) {
    const e = await this.prisma.entity.findUnique({
      where: { id: entityId },
      select: { id: true, name: true, createdById: true },
    });
    if (!e) throw new NotFoundException('Entity not found');
    if (e.createdById !== userId) throw new ForbiddenException('Not allowed');
    return e;
  }

  private async ensureCanManageInvitations(userId: string, entityId: string) {
    const e = await this.prisma.entity.findUnique({
      where: { id: entityId },
      select: { id: true, name: true, createdById: true },
    });
    if (!e) throw new NotFoundException('Entity not found');
    const membership = await this.prisma.entityMember
      .findUnique({
        where: { entityId_userId: { entityId, userId } },
        select: { role: true, status: true },
      })
      .catch(() => null);

    if (membership?.status === 'BANNED') {
      throw new ForbiddenException('You have been banned from this entity');
    }

    if (e.createdById === userId) {
      return {
        entity: e,
        membership: membership ?? { role: EntityRole.OWNER },
      };
    }

    if (
      !membership ||
      !['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(membership.role)
    ) {
      throw new ForbiddenException('Not allowed');
    }

    return { entity: e, membership };
  }

  private roleDtoToDb(
    role: EntityRoleDto,
  ): 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER' | 'VIEWER' {
    return role as 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER' | 'VIEWER';
  }

  private ensureNotOwner(
    role: string,
    message = 'Operation not allowed on OWNER',
  ) {
    if (role === 'OWNER') throw new ForbiddenException(message);
  }

  // --- members ---
  // Only list active members by default
  async listMembers(
    userId: string,
    entityId: string,
    status: EntityMemberStatus = 'ACTIVE',
  ) {
    const { membership } = await this.ensureCanManageInvitations(
      userId,
      entityId,
    );

    const where: Prisma.EntityMemberWhereInput = { entityId, status };

    // RESTRICTION: Instructors only see Learners (Participants)
    if (membership.role === 'INSTRUCTOR') {
      where.role = EntityRole.LEARNER;
    }

    return this.prisma.entityMember.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  /**
   * Ajoute un membre à une entité (Flow v2.0 §6).
   *
   * Deux cas :
   *  A. L'email correspond à un User existant -> on crée juste l'EntityMember.
   *     L'utilisateur reçoit une notification "Vous avez été ajouté à …".
   *  B. L'email est inconnu -> on crée un User INVITED avec un mot de passe
   *     temporaire (12 chars Crockford), on crée l'EntityMember, et on lui
   *     envoie un email avec ses identifiants + procédure de première
   *     connexion (cf. flow /first-login).
   *
   * La réponse inclut `requiresInvitation: boolean` pour que le frontend
   * affiche le bon message ("ajouté" vs "invitation envoyée").
   */
  async addMember(actorId: string, entityId: string, dto: AddMemberDto) {
    await this.ensureMine(actorId, entityId);

    const email = dto.email.trim().toLowerCase();
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      select: { name: true },
    });
    if (!entity) throw new NotFoundException('Entity not found');

    const inviter = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { firstname: true, lastname: true, email: true },
    });
    const inviterName = inviter
      ? `${inviter.firstname} ${inviter.lastname}`.trim() || inviter.email
      : 'Hummind';

    let user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, firstname: true, lastname: true, email: true },
    });
    let requiresInvitation = false;
    let tempPasswordForEmail: string | null = null;

    if (!user) {
      // --- Cas B : auto-création ---
      const fallbackFirstname =
        dto.firstname?.trim() ||
        email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
        'Invité';
      const fallbackLastname = dto.lastname?.trim() || 'Hummind';

      const tempPassword = generateTempPassword(12);
      const passwordHash = await argon2.hash(tempPassword);
      tempPasswordForEmail = tempPassword;

      user = await this.prisma.user.create({
        data: {
          email,
          firstname: fallbackFirstname,
          lastname: fallbackLastname,
          passwordHash,
          platformRole: PlatformRole.MEMBER,
          status: UserStatus.INVITED,
          mustChangePassword: true,
          // Sera vérifié quand l'invité finalisera son mot de passe via /first-login.
          emailVerifiedAt: new Date(),
        },
        select: { id: true, firstname: true, lastname: true, email: true },
      });
      requiresInvitation = true;
    }

    // --- Création EntityMember (commune aux deux cas) ---
    try {
      const member = await this.prisma.entityMember.create({
        data: {
          entityId,
          userId: user.id,
          role: this.roleDtoToDb(dto.role),
        },
        include: {
          user: {
            select: { id: true, firstname: true, lastname: true, email: true },
          },
        },
      });

      // --- Email (fire-and-forget via la queue BullMQ) ---
      if (tempPasswordForEmail) {
        void this.mail.sendAccountCreatedByAdmin({
          to: user.email,
          firstname: user.firstname,
          email: user.email,
          tempPassword: tempPasswordForEmail,
          entityName: entity.name,
          inviterName,
        });
      } else {
        void this.mail.sendPlainText(
          user.email,
          `Vous avez été ajouté(e) à ${entity.name}`,
          `Bonjour ${user.firstname},\n\n${inviterName} vous a ajouté(e) à ${entity.name} sur Hummind. Connectez-vous pour y accéder.\n\n— L'équipe Hummind`,
        );
      }

      return { ...member, requiresInvitation };
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException(
          'User is already a member of this entity',
        );
      }
      throw new BadRequestException(
        (e as Error)?.message ?? 'Add member failed',
      );
    }
  }

  async updateRole(userId: string, memberId: string, dto: UpdateMemberRoleDto) {
    const member = await this.prisma.entityMember.findUnique({
      where: { id: memberId },
      include: { entity: { select: { id: true, createdById: true } } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.entity.createdById !== userId) throw new ForbiddenException();

    this.ensureNotOwner(member.role, 'Cannot modify OWNER role');

    return this.prisma.entityMember.update({
      where: { id: memberId },
      data: { role: this.roleDtoToDb(dto.role) },
    });
  }

  async removeMember(userId: string, memberId: string) {
    const member = await this.prisma.entityMember.findUnique({
      where: { id: memberId },
      include: { entity: { select: { id: true, createdById: true } } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.entity.createdById !== userId) throw new ForbiddenException();

    this.ensureNotOwner(member.role, 'Cannot remove OWNER');

    return this.prisma.entityMember.delete({ where: { id: memberId } });
  }

  // --- Ban / Unban ---
  private async ensureCanBan(actorUserId: string, targetMemberId: string) {
    const targetMember = await this.prisma.entityMember.findUnique({
      where: { id: targetMemberId },
      include: { entity: { select: { id: true, createdById: true } } },
    });
    if (!targetMember) throw new NotFoundException('Target member not found');

    const entityId = targetMember.entity.id;
    const isTargetOwner = targetMember.role === 'OWNER';

    // Anti-self ban
    if (targetMember.userId === actorUserId) {
      throw new ForbiddenException('You cannot ban yourself');
    }

    // Owner protection
    if (isTargetOwner) {
      throw new ForbiddenException('Cannot ban the OWNER of the entity');
    }

    const actorMembership = await this.prisma.entityMember.findUnique({
      where: { entityId_userId: { entityId, userId: actorUserId } },
    });

    const isActorEntityCreator =
      targetMember.entity.createdById === actorUserId;
    const actorRole = actorMembership?.role;

    // Permissions logic
    if (isActorEntityCreator || actorRole === 'OWNER') {
      // Owner can ban anyone (already checked anti-self and anti-owner above)
      return targetMember;
    }

    if (actorRole === 'ADMIN') {
      // Admin can ban Instructors and Learners, but not other Admins
      if (['INSTRUCTOR', 'LEARNER'].includes(targetMember.role)) {
        return targetMember;
      }
      throw new ForbiddenException('ADMIN cannot ban another ADMIN or OWNER');
    }

    throw new ForbiddenException('You do not have permission to ban members');
  }

  async banMember(
    userId: string,
    entityId: string,
    memberId: string,
    dto: BanMemberDto,
  ) {
    const target = await this.ensureCanBan(userId, memberId);
    if (target.entityId !== entityId) throw new BadRequestException('Mismatch');
    if (target.status === 'BANNED')
      throw new BadRequestException('Already banned');

    return this.prisma.entityMember.update({
      where: { id: memberId },
      data: {
        status: 'BANNED',
        bannedAt: new Date(),
        bannedBy: userId,
        banReason: dto.reason,
      },
    });
  }

  async unbanMember(userId: string, entityId: string, memberId: string) {
    const target = await this.ensureCanBan(userId, memberId); // Uses same permission levels
    if (target.entityId !== entityId) throw new BadRequestException('Mismatch');
    if (target.status === 'ACTIVE')
      throw new BadRequestException('Member is active');

    return this.prisma.entityMember.update({
      where: { id: memberId },
      data: {
        status: 'ACTIVE',
        bannedAt: null,
        bannedBy: null,
        banReason: null,
      },
    });
  }

  // --- invitations ---
  async listInvitations(userId: string, entityId: string) {
    const { membership } = await this.ensureCanManageInvitations(
      userId,
      entityId,
    );

    const where: Prisma.EntityInvitationWhereInput = { entityId };

    // RESTRICTION: Instructors only see Learner invitations
    if (membership.role === 'INSTRUCTOR') {
      where.role = EntityRole.LEARNER;
    }

    return this.prisma.entityInvitation.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async invite(userId: string, entityId: string, dto: InviteMemberDto) {
    // Check permissions
    const { entity, membership } = await this.ensureCanManageInvitations(
      userId,
      entityId,
    );

    // RESTRICTION: Instructors can only invite Learners
    if (
      membership.role === 'INSTRUCTOR' &&
      dto.role !== EntityRoleDto.LEARNER
    ) {
      throw new ForbiddenException('Instructors can only invite Learners');
    }
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      const already = await this.prisma.entityMember
        .findUnique({
          where: { entityId_userId: { entityId, userId: existingUser.id } },
        })
        .catch(() => null);
      if (already) throw new BadRequestException('User already a member');
    }

    const token = randomUUID();
    const expiresAt = this.getInvitationExpiresAt();

    const invitation = await this.prisma.entityInvitation.create({
      data: {
        entityId,
        email,
        role: this.roleDtoToDb(dto.role),
        token,
        inviterId: userId,
        expiresAt,
      },
    });

    await this.mail.sendEntityInvitation(email, token, entity.name);

    const base =
      this.cfg.get<string>('INVITE_BASE_URL') ??
      `${process.env.FRONTEND_URL || 'https://monapp.com'}/invitations/accept`;
    const link = `${base}?token=${encodeURIComponent(token)}`;

    return { id: invitation.id, token, link, expiresAt };
  }

  async createPublicInvitationLink(
    userId: string,
    entityId: string,
    dto: CreatePublicInvitationLinkDto,
  ) {
    const { membership } = await this.ensureCanManageInvitations(
      userId,
      entityId,
    );

    // RESTRICTION: Instructors can only invite Learners
    if (
      membership.role === 'INSTRUCTOR' &&
      dto.role &&
      dto.role !== EntityRoleDto.LEARNER
    ) {
      throw new ForbiddenException('Instructors can only invite Learners');
    }

    const token = randomUUID();
    const expiresAt = this.getInvitationExpiresAt();

    const invitation = await this.prisma.entityInvitation.create({
      data: {
        entityId,
        email: EntityMembersService.PUBLIC_INVITE_EMAIL,
        role: this.roleDtoToDb(dto.role ?? EntityRoleDto.LEARNER),
        token,
        inviterId: userId,
        expiresAt,
      },
    });

    const base =
      this.cfg.get<string>('PUBLIC_INVITE_BASE_URL') ??
      this.cfg.get<string>('INVITE_BASE_URL') ??
      `${process.env.FRONTEND_URL || 'https://hummind.ai'}/invitations/request`;

    const link = `${base}?token=${encodeURIComponent(token)}`;

    return { id: invitation.id, token, link, expiresAt };
  }

  async revokeInvitation(userId: string, invitationId: string) {
    const inv = await this.prisma.entityInvitation.findUnique({
      where: { id: invitationId },
      include: { entity: { select: { id: true, createdById: true } } },
    });
    if (!inv) throw new NotFoundException('Invitation not found');
    if (inv.entity.createdById !== userId) throw new ForbiddenException();

    if (inv.acceptedAt)
      throw new BadRequestException('Invitation already accepted');
    if (inv.revokedAt) return inv;

    return this.prisma.entityInvitation.update({
      where: { id: invitationId },
      data: { revokedAt: new Date() },
    });
  }

  async requestAccessViaToken(
    dto: RequestJoinViaTokenDto,
    currentUserId?: string,
  ) {
    if (!currentUserId)
      throw new BadRequestException('Authentication required');

    const inv = await this.prisma.entityInvitation.findUnique({
      where: { token: dto.token },
    });
    if (!inv) throw new NotFoundException('Invalid token');

    if (inv.email !== EntityMembersService.PUBLIC_INVITE_EMAIL) {
      throw new BadRequestException(
        'This token is not a public invitation token',
      );
    }

    if (inv.revokedAt) throw new BadRequestException('Invitation revoked');
    if (inv.expiresAt.getTime() <= Date.now())
      throw new BadRequestException('Invitation expired');
    if (inv.acceptedAt)
      throw new BadRequestException('Invitation already processed');

    const existingMember = await this.prisma.entityMember
      .findUnique({
        where: {
          entityId_userId: { entityId: inv.entityId, userId: currentUserId },
        },
        select: { id: true },
      })
      .catch(() => null);

    if (existingMember) {
      return {
        message: 'Already member',
        entityId: inv.entityId,
        status: 'APPROVED' as const,
      };
    }

    const requester = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, email: true },
    });
    if (!requester) throw new NotFoundException('User not found');

    const existingPendingRequest = await this.prisma.entityInvitation.findFirst(
      {
        where: {
          entityId: inv.entityId,
          requesterId: currentUserId,
          acceptedAt: null,
          revokedAt: null,
        },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    );

    if (existingPendingRequest) {
      return {
        message: 'Join request already pending',
        request: {
          id: existingPendingRequest.id,
          entityId: inv.entityId,
          status: 'PENDING' as const,
          createdAt: existingPendingRequest.createdAt,
        },
      };
    }

    const token = randomUUID();
    const expiresAt = this.getInvitationExpiresAt();

    const request = await this.prisma.entityInvitation.create({
      data: {
        entityId: inv.entityId,
        email: requester.email.toLowerCase().trim(),
        role: inv.role,
        token,
        inviterId: inv.inviterId ?? null,
        requesterId: currentUserId,
        expiresAt,
      },
      select: {
        id: true,
        entityId: true,
        createdAt: true,
      },
    });

    this.eventEmitter.emit('join-request.created', {
      entityId: inv.entityId,
      requesterId: currentUserId,
    });

    return {
      message: 'Join request submitted and pending approval',
      request: {
        ...request,
        status: 'PENDING' as const,
      },
    };
  }

  // Public: accepter une invitation (sans auth obligatoire)
  async acceptInvitation(dto: AcceptInvitationDto, currentUserId?: string) {
    const inv = await this.prisma.entityInvitation.findUnique({
      where: { token: dto.token },
    });
    if (!inv) throw new NotFoundException('Invalid token');

    if (inv.revokedAt) throw new BadRequestException('Invitation revoked');
    if (inv.expiresAt.getTime() <= Date.now())
      throw new BadRequestException('Invitation expired');
    if (inv.acceptedAt) return { message: 'Already accepted' };

    let userId = currentUserId;
    if (!userId) {
      const user = await this.prisma.user.findUnique({
        where: { email: inv.email },
      });
      if (!user)
        throw new BadRequestException(
          'No account for this email. Please sign up first.',
        );
      userId = user.id;
    }

    try {
      await this.prisma.entityMember.create({
        data: {
          entityId: inv.entityId,
          userId: userId,
          role: inv.role,
        },
      });
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw e;
      }
    }

    await this.prisma.entityInvitation.update({
      where: { id: inv.id },
      data: { acceptedAt: new Date() },
    });

    return {
      message: 'Invitation accepted',
      entityId: inv.entityId,
      role: inv.role,
    };
  }

  // --- join requests (admin) ---
  async listJoinRequests(userId: string, entityId: string) {
    const { membership } = await this.ensureCanManageInvitations(
      userId,
      entityId,
    );

    const whereClause: Prisma.EntityInvitationWhereInput = {
      entityId,
      requesterId: { not: null }, // Only requests initiated by users
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    };

    // RESTRICTION: Instructors can only see Learner requests
    if (membership.role === 'INSTRUCTOR') {
      whereClause.role = EntityRole.LEARNER;
    }

    return this.prisma.entityInvitation.findMany({
      where: whereClause,
      include: {
        requester: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            picture: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async approveJoinRequest(userId: string, requestId: string) {
    const inv = await this.prisma.entityInvitation.findUnique({
      where: { id: requestId },
      include: {
        entity: { select: { id: true, createdById: true, name: true } },
      },
    });
    if (!inv) throw new NotFoundException('Request not found');
    if (!inv.requesterId) throw new BadRequestException('Not a join request');

    const { membership } = await this.ensureCanManageInvitations(
      userId,
      inv.entityId,
    );

    // RESTRICTION: Instructors can only approve Learners
    if (membership.role === 'INSTRUCTOR' && inv.role !== EntityRole.LEARNER) {
      throw new ForbiddenException(
        'Instructors can only approve Learner requests',
      );
    }

    if (inv.acceptedAt) throw new BadRequestException('Already approved');
    if (inv.revokedAt)
      throw new BadRequestException('Request was rejected/revoked');

    // Create member
    // Check if already member
    const existing = await this.prisma.entityMember.findUnique({
      where: {
        entityId_userId: { entityId: inv.entityId, userId: inv.requesterId },
      },
    });

    if (!existing) {
      await this.prisma.entityMember.create({
        data: {
          entityId: inv.entityId,
          userId: inv.requesterId,
          role: inv.role,
        },
      });
    }

    // Mark accepted
    await this.prisma.entityInvitation.update({
      where: { id: requestId },
      data: { acceptedAt: new Date() },
    });

    // Log activity
    this.eventEmitter.emit('join-request.approved', {
      entityId: inv.entityId,
      requesterId: inv.requesterId,
      entityName: inv.entity.name,
    });

    return { message: 'Approved' };
  }

  async rejectJoinRequest(userId: string, requestId: string) {
    const inv = await this.prisma.entityInvitation.findUnique({
      where: { id: requestId },
      include: {
        entity: { select: { id: true, createdById: true, name: true } },
      },
    });
    if (!inv) throw new NotFoundException('Request not found');
    const { membership } = await this.ensureCanManageInvitations(
      userId,
      inv.entityId,
    );

    // RESTRICTION: Instructors can only reject Learners
    if (membership.role === 'INSTRUCTOR' && inv.role !== EntityRole.LEARNER) {
      throw new ForbiddenException(
        'Instructors can only reject Learner requests',
      );
    }

    if (inv.acceptedAt) throw new BadRequestException('Already approved');

    await this.prisma.entityInvitation.update({
      where: { id: requestId },
      data: { revokedAt: new Date() },
    });

    if (inv.requesterId) {
      this.eventEmitter.emit('join-request.rejected', {
        entityId: inv.entityId,
        requesterId: inv.requesterId,
        entityName: inv.entity.name,
      });
    }

    return { message: 'Rejected' };
  }

  // --- Global Access Requests (for Unified Dashboard) ---
  async getAllPendingRequests(userId: string) {
    // 1. Find all entities where user is ADMIN, OWNER or INSTRUCTOR AND entity is ACTIVE
    const memberships = await this.prisma.entityMember.findMany({
      where: {
        userId,
        role: { in: ['OWNER', 'ADMIN', 'INSTRUCTOR'] },
        entity: { status: 'ACTIVE' },
      },
      select: { entityId: true, role: true },
    });

    if (memberships.length === 0) return [];

    const entityIds = memberships.map((m) => m.entityId);

    // 2. Fetch potentially relevant requests
    const requests = await this.prisma.entityInvitation.findMany({
      where: {
        entityId: { in: entityIds },
        requesterId: { not: null },
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        entity: { status: 'ACTIVE' }, // Double check, though covered by entityIds
      },
      include: {
        entity: {
          select: { id: true, name: true, type: true },
        },
        requester: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            picture: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    // 3. Post-filter based on user's role in each entity
    const membershipMap = new Map<string, string>();
    memberships.forEach((m) => membershipMap.set(m.entityId, m.role));

    return requests.filter((req) => {
      const myRole = membershipMap.get(req.entityId);
      if (!myRole) return false;

      // Instructors only see LEARNER requests
      if (myRole === 'INSTRUCTOR') {
        return req.role === EntityRole.LEARNER;
      }

      // Admins/Owners see everything
      return true;
    });
  }

  // --- Global Member List (for Unified Dashboard) ---
  async getAllMembers(userId: string) {
    // 1. Find all entities where user is ADMIN, OWNER or INSTRUCTOR AND entity is ACTIVE
    const myMemberships = await this.prisma.entityMember.findMany({
      where: {
        userId,
        role: { in: ['OWNER', 'ADMIN', 'INSTRUCTOR'] },
        entity: { status: 'ACTIVE' },
      },
      select: { entityId: true, role: true },
    });

    if (myMemberships.length === 0) return [];

    const entityIds = myMemberships.map((m) => m.entityId);

    // 2. Fetch ALL members of these entities
    const allMembers = await this.prisma.entityMember.findMany({
      where: {
        entityId: { in: entityIds },
        entity: { status: 'ACTIVE' }, // Double check
      },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            picture: true,
          },
        },
        entity: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: [{ entityId: 'asc' }, { role: 'asc' }],
    });

    // 3. Post-filter based on user's role in each entity
    const myRoleMap = new Map<string, string>();
    myMemberships.forEach((m) => myRoleMap.set(m.entityId, m.role));

    return allMembers.filter((member) => {
      const myRole = myRoleMap.get(member.entityId);
      if (!myRole) return false;

      // Instructors only see LEARNERS
      if (myRole === 'INSTRUCTOR') {
        return member.role === EntityRole.LEARNER;
      }

      // Admins/Owners see everyone
      return true;
    });
  }

  // --- Bulk Actions ---
  async handleBulkRequests(
    userId: string,
    dto: { requestIds: string[]; action: 'APPROVE' | 'REJECT' },
  ) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as { id: string; error: string }[],
    };

    for (const requestId of dto.requestIds) {
      try {
        if (dto.action === 'APPROVE') {
          await this.approveJoinRequest(userId, requestId);
        } else {
          await this.rejectJoinRequest(userId, requestId);
        }
        results.success++;
      } catch (e: unknown) {
        results.failed++;
        results.errors.push({
          id: requestId,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}
