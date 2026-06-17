import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { AdminContactsService } from './admin-contacts.service';
import { AdminUsersService } from './admin-users.service';
import { UserGdprService } from './user-gdpr.service';
import {
  ListContactsQueryDto,
  UpdateContactStatusDto,
} from './admin-contacts.dto';
import {
  ListAdminUsersQueryDto,
  ListAuditLogQueryDto,
  UpdateAdminUserStatusDto,
} from './admin-users.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ROOT')
export class AdminController {
  constructor(
    private readonly contacts: AdminContactsService,
    private readonly users: AdminUsersService,
    private readonly gdpr: UserGdprService,
  ) {}

  // -----------------------------------------------------------------
  // ContactMessage — read & generic update
  // -----------------------------------------------------------------

  @Get('contacts')
  list(@Query() query: ListContactsQueryDto) {
    return this.contacts.list(query);
  }

  @Get('contacts/stats')
  stats() {
    return this.contacts.statsByStatus();
  }

  @Get('contacts/:id')
  one(@Param('id') id: string) {
    return this.contacts.findOne(id);
  }

  /**
   * Generic status update. For ACCEPTED/REJECTED, prefer the dedicated
   * endpoints below (full workflow + email + audit). Used for the
   * NEW → CONTACTED or → ARCHIVED transitions.
   */
  @Patch('contacts/:id')
  update(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body() body: UpdateContactStatusDto,
  ) {
    return this.contacts.updateStatus(id, body, actor.id);
  }

  // -----------------------------------------------------------------
  // ROOT pipeline (Flow v2.0): 3 dedicated actions
  // -----------------------------------------------------------------

  @Post('contacts/:id/accept')
  @HttpCode(HttpStatus.OK)
  accept(@CurrentUser() actor: RequestUser, @Param('id') id: string) {
    return this.contacts.accept({ id, actorId: actor.id });
  }

  @Post('contacts/:id/contact')
  @HttpCode(HttpStatus.OK)
  contact(@CurrentUser() actor: RequestUser, @Param('id') id: string) {
    return this.contacts.markContacted({ id, actorId: actor.id });
  }

  @Post('contacts/:id/reject')
  @HttpCode(HttpStatus.OK)
  reject(@CurrentUser() actor: RequestUser, @Param('id') id: string) {
    return this.contacts.reject({ id, actorId: actor.id });
  }

  // -----------------------------------------------------------------
  // Users (Flow v2.0 Phase 8)
  // -----------------------------------------------------------------

  @Get('users')
  listUsers(@Query() query: ListAdminUsersQueryDto) {
    return this.users.list(query);
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body() body: UpdateAdminUserStatusDto,
  ) {
    return this.users.updateStatus(actor.id, id, body);
  }

  // -----------------------------------------------------------------
  // Audit log read-only
  // -----------------------------------------------------------------

  @Get('audit-log')
  listAuditLog(@Query() query: ListAuditLogQueryDto) {
    return this.users.listAuditLog(query);
  }

  // -----------------------------------------------------------------
  // GDPR — soft-delete d'un user par ROOT (Flow v2.0 Phase 9)
  // -----------------------------------------------------------------

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  softDeleteUser(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.gdpr.softDelete({
      actorId: actor.id,
      targetUserId: id,
      reason: body?.reason,
    });
  }
}
