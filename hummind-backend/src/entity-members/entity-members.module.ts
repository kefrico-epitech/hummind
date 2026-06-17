import { Module } from '@nestjs/common';
import {
  EntityMembersController,
  EntityInvitationsPublicController,
} from './entity-members.controller';
import { EntityMembersService } from './entity-members.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [],
  controllers: [EntityMembersController, EntityInvitationsPublicController],
  providers: [EntityMembersService, PrismaService, MailService],
  exports: [EntityMembersService],
})
export class EntityMembersModule {}
