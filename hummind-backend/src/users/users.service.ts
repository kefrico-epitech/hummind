import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, PlatformRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    try {
      const { firstname, lastname, email, password, platformRole } = dto;
      const passwordHash = await argon2.hash(password);
      return await this.prisma.user.create({
        data: {
          firstname,
          lastname,
          email,
          passwordHash: passwordHash ?? '',
          platformRole: platformRole ?? PlatformRole.MEMBER,
        },
        select: this.defaultSelect(),
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async findAll(q: QueryUserDto) {
    const {
      search,
      platformRole,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = q;

    const where: Prisma.UserWhereInput = {
      ...(platformRole ? { platformRole } : {}),
      ...(search
        ? {
            OR: [
              { firstname: { contains: search, mode: 'insensitive' } },
              { lastname: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        select: this.defaultSelect(),
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.defaultSelect(),
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      // Vérifie existence
      await this.ensureExists(id);

      const data: Prisma.UserUpdateInput = {
        ...(dto.firstname !== undefined ? { firstname: dto.firstname } : {}),
        ...(dto.lastname !== undefined ? { lastname: dto.lastname } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.passwordHash !== undefined
          ? { passwordHash: dto.passwordHash }
          : {}),
        ...(dto.platformRole !== undefined
          ? { platformRole: dto.platformRole }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.emailVerifiedAt !== undefined
          ? { emailVerifiedAt: dto.emailVerifiedAt }
          : {}),
      };

      return await this.prisma.user.update({
        where: { id },
        data,
        select: this.defaultSelect(),
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async remove(id: string) {
    // Avec onDelete: Cascade sur les relations, ceci supprimera les tokens liés
    await this.ensureExists(id);
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  // Helpers

  private defaultSelect(): Prisma.UserSelect {
    return {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      platformRole: true,
      status: true,
      mustChangePassword: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
      // ne renvoie jamais passwordHash par défaut
    };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('User not found');
  }

  private handlePrismaError(e: unknown): never {
    // P2002 = unique constraint
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (e as any).code === 'P2002'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const fields = ((e as any).meta?.target as string[]) ?? [];
      if (fields.includes('email')) {
        throw new BadRequestException('Email already in use');
      }
      throw new BadRequestException(
        `Unique constraint failed: ${fields.join(', ')}`,
      );
    }
    throw e;
  }
}
