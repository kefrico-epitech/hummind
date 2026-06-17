import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { AdminController } from './admin.controller';
import { AdminContactsService } from './admin-contacts.service';
import { AdminUsersService } from './admin-users.service';
import { UserGdprService } from './user-gdpr.service';
import { AuditLogService } from './audit-log.service';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [PrismaModule, AuthModule, MailModule],
  controllers: [AdminController],
  providers: [
    AdminContactsService,
    AdminUsersService,
    UserGdprService,
    AuditLogService,
    RolesGuard,
  ],
  exports: [RolesGuard, AuditLogService, UserGdprService],
})
export class AdminModule {}
