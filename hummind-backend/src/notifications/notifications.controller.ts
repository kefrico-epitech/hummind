import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  CurrentUser,
  CurrentUserId,
  RequestUser,
} from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ReadNotificationDto } from './dto/read-notification.dto';
import { ReadAllNotificationsDto } from './dto/read-all-notifications.dto';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @ApiOperation({ summary: 'Lister mes notifications' })
  @ApiOkResponse({ description: 'Liste paginee' })
  @Get()
  list(@CurrentUserId() userId: string, @Query() q: QueryNotificationDto) {
    return this.service.list(userId, q);
  }

  @ApiOperation({ summary: 'Compteurs (total, unread)' })
  @Get('counts')
  counts(@CurrentUserId() userId: string, @Query() q: QueryNotificationDto) {
    return this.service.counts(userId, q);
  }

  @ApiOperation({ summary: 'Creer une notification (admin)' })
  @Post()
  create(
    @CurrentUser() current: RequestUser,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.service.create(current, dto);
  }

  @ApiOperation({ summary: 'Marquer lu / non-lu' })
  @Patch(':id/read')
  read(
    @CurrentUserId() userId: string,
    @CurrentUser() current: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReadNotificationDto,
  ) {
    const isAdmin = current?.role === 'ADMIN';
    return this.service.markRead(userId, id, dto, isAdmin);
  }

  @ApiOperation({ summary: 'Tout marquer lu' })
  @Post('read-all')
  readAll(
    @CurrentUserId() userId: string,
    @Body() dto: ReadAllNotificationsDto,
  ) {
    return this.service.readAll(userId, dto);
  }

  @ApiOperation({ summary: 'Details d une notification' })
  @Get(':id')
  getOne(
    @CurrentUserId() userId: string,
    @CurrentUser() current: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const isAdmin = current?.role === 'ADMIN';
    return this.service.getOne(userId, id, isAdmin);
  }

  @ApiOperation({ summary: 'Supprimer une notification' })
  @Delete(':id')
  remove(
    @CurrentUserId() userId: string,
    @CurrentUser() current: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const isAdmin = current?.role === 'ADMIN';
    return this.service.remove(userId, id, isAdmin);
  }
}
