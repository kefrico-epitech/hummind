import { Injectable, Logger } from '@nestjs/common';
import {
  ContactKind,
  LearnerVolume,
  OrganizationType,
  ProjectHorizon,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateContactMessageDto } from './contact.dto';

const KIND_MAP: Record<string, ContactKind> = {
  demo: ContactKind.DEMO,
  support: ContactKind.SUPPORT,
  general: ContactKind.GENERAL,
};

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateContactMessageDto,
    userId?: string,
  ): Promise<{ id: string }> {
    const row = await this.prisma.contactMessage.create({
      data: {
        kind: KIND_MAP[dto.kind] ?? ContactKind.GENERAL,
        name: dto.name?.trim() ?? null,
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() ?? null,
        role: dto.role?.trim() ?? null,
        organizationName: dto.organizationName?.trim() ?? null,
        organizationType: dto.organizationType
          ? (dto.organizationType as OrganizationType)
          : null,
        learnerVolume: dto.learnerVolume
          ? (dto.learnerVolume as LearnerVolume)
          : null,
        website: dto.website?.trim() ?? null,
        country: dto.country?.trim() ?? null,
        city: dto.city?.trim() ?? null,
        message: dto.message.trim(),
        horizon: dto.horizon ? (dto.horizon as ProjectHorizon) : null,
        source: dto.source ?? null,
        userId: userId ?? null,
      },
      select: { id: true },
    });

    this.logger.log(
      `New ${dto.kind} contact from ${dto.email} (id=${row.id}, org=${
        dto.organizationName ?? 'n/a'
      }, source=${dto.source ?? 'n/a'})`,
    );

    return row;
  }
}
