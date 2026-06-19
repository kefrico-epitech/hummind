import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeUser } from '../auth/auth.service';
import { CreateUserDto, ListUsersQueryDto, UpdateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const take = query.take ?? 20;
    const skip = (page - 1) * take;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.role ? { role: query.role } : {}),
      ...(query.q
        ? {
            OR: [
              { email: { contains: query.q, mode: 'insensitive' } },
              { firstName: { contains: query.q, mode: 'insensitive' } },
              { lastName: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map(sanitizeUser),
      total,
      page,
      take,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return sanitizeUser(user);
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName ?? '',
          lastName: dto.lastName ?? '',
          role: dto.role ?? Role.USER,
          locale: dto.locale ?? 'fr',
          mustChangePassword: dto.mustChangePassword ?? false,
          profileCompleted: dto.profileCompleted ?? false,
          onboardingCompleted: dto.onboardingCompleted ?? false,
        },
      });

      await this.ensureLearnerArtifacts(tx, created.id, created.role);
      return created;
    });

    return sanitizeUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Utilisateur introuvable.');

    const user = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.UserUpdateInput = {
        ...(dto.email ? { email: dto.email.toLowerCase() } : {}),
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.role ? { role: dto.role } : {}),
        ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        ...(dto.mustChangePassword !== undefined
          ? { mustChangePassword: dto.mustChangePassword }
          : {}),
        ...(dto.profileCompleted !== undefined
          ? { profileCompleted: dto.profileCompleted }
          : {}),
        ...(dto.onboardingCompleted !== undefined
          ? { onboardingCompleted: dto.onboardingCompleted }
          : {}),
      };

      if (dto.password) {
        data.passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
      }

      const updated = await tx.user.update({
        where: { id },
        data,
      });

      if (updated.role === Role.USER) {
        await this.ensureLearnerArtifacts(tx, updated.id, updated.role);
      }

      return updated;
    });

    return sanitizeUser(user);
  }

  async remove(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }

  private async ensureLearnerArtifacts(
    tx: Prisma.TransactionClient,
    userId: string,
    role: Role,
  ): Promise<void> {
    if (role !== Role.USER) return;

    await tx.learnerProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        summary: null,
      },
    });

    await tx.gamificationProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
      },
    });
  }
}
