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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EntityMembersService } from './entity-members.service';
import { AddMemberDto } from './dto/add-member.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CurrentUser, CurrentUserId } from '../auth/current-user.decorator';
import { CreatePublicInvitationLinkDto } from './dto/create-public-invitation-link.dto';
import { RequestJoinViaTokenDto } from './dto/request-join-via-token.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { BanMemberDto } from './dto/ban-member.dto';
import { EntityMemberStatus } from '@prisma/client';

@ApiTags('entity-members')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('entities/:entityId/members')
export class EntityMembersController {
  constructor(private readonly service: EntityMembersService) {}

  @ApiOperation({ summary: 'Lister les membres' })
  @ApiQuery({
    name: 'status',
    enum: EntityMemberStatus,
    required: false,
    description: 'Filtrer par statut',
  })
  @Get()
  listMembers(
    @CurrentUserId() userId: string,
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Query('status') status?: EntityMemberStatus,
  ) {
    return this.service.listMembers(userId, entityId, status);
  }

  @ApiOperation({ summary: 'Ajouter un membre existant' })
  @Post()
  addMember(
    @CurrentUserId() userId: string,
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.service.addMember(userId, entityId, dto);
  }

  @ApiOperation({ summary: 'Changer le role d un membre' })
  @Patch(':memberId/role')
  updateRole(
    @CurrentUserId() userId: string,
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.service.updateRole(userId, memberId, dto);
  }

  @ApiOperation({ summary: 'Supprimer un membre' })
  @Delete(':memberId')
  removeMember(
    @CurrentUserId() userId: string,
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
  ) {
    return this.service.removeMember(userId, memberId);
  }

  @ApiOperation({ summary: "Bannir un membre de l'entite" })
  @Post(':memberId/ban')
  banMember(
    @CurrentUserId() userId: string,
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Body() dto: BanMemberDto,
  ) {
    return this.service.banMember(userId, entityId, memberId, dto);
  }

  @ApiOperation({ summary: "Debannir un membre de l'entite" })
  @Post(':memberId/unban')
  unbanMember(
    @CurrentUserId() userId: string,
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
  ) {
    return this.service.unbanMember(userId, entityId, memberId);
  }

  @ApiOperation({ summary: 'Lister les invitations' })
  @Get('invitations')
  listInvitations(
    @CurrentUserId() userId: string,
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
  ) {
    return this.service.listInvitations(userId, entityId);
  }

  @ApiOperation({ summary: 'Inviter par email (envoie un lien)' })
  @Post('invitations')
  invite(
    @CurrentUserId() userId: string,
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.service.invite(userId, entityId, dto);
  }

  @ApiOperation({ summary: 'Generer un lien public d invitation' })
  @Post('invitations/public-link')
  createPublicLink(
    @CurrentUserId() userId: string,
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Body() dto: CreatePublicInvitationLinkDto,
  ) {
    return this.service.createPublicInvitationLink(userId, entityId, dto);
  }

  @ApiOperation({ summary: 'Revoquer une invitation' })
  @Post('invitations/:invitationId/revoke')
  revoke(
    @CurrentUserId() userId: string,
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Param('invitationId', new ParseUUIDPipe()) invitationId: string,
  ) {
    return this.service.revokeInvitation(userId, invitationId);
  }

  @ApiOperation({ summary: 'Lister les demandes d adhesion (Admin)' })
  @Get('join-requests')
  listJoinRequests(
    @CurrentUserId() userId: string,
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
  ) {
    return this.service.listJoinRequests(userId, entityId);
  }
}

@ApiTags('entity-members')
@Controller('entity-members')
export class EntityInvitationsPublicController {
  constructor(private readonly service: EntityMembersService) {}

  @ApiOperation({ summary: 'Approuver une demande (Global Admin)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('join-requests/:requestId/approve')
  approveRequest(
    @CurrentUserId() userId: string,
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
  ) {
    return this.service.approveJoinRequest(userId, requestId);
  }

  @ApiOperation({ summary: 'Rejeter une demande (Global Admin)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('join-requests/:requestId/reject')
  rejectRequest(
    @CurrentUserId() userId: string,
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
  ) {
    return this.service.rejectJoinRequest(userId, requestId);
  }

  @ApiOperation({ summary: 'Lister TOUTES les demandes d adhesion (Global)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('join-requests')
  listAllRequests(@CurrentUserId() userId: string) {
    return this.service.getAllPendingRequests(userId);
  }

  @ApiOperation({ summary: 'Lister TOUS les membres visibles (Global)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get()
  listAllMembers(@CurrentUserId() userId: string) {
    return this.service.getAllMembers(userId);
  }

  @ApiOperation({ summary: 'Traitement par lots (Bulk) des demandes' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('join-requests/bulk')
  bulkAction(@CurrentUserId() userId: string, @Body() dto: BulkActionDto) {
    return this.service.handleBulkRequests(userId, dto);
  }

  @ApiOperation({ summary: 'Accepter une invitation (public, via token)' })
  @ApiOkResponse({
    description: 'Cree le membership et marque l invitation acceptee',
  })
  @Post('accept')
  accept(
    @Body() dto: AcceptInvitationDto,
    @CurrentUser() current?: { id: string },
  ) {
    const currentUserId = current?.id;
    return this.service.acceptInvitation(dto, currentUserId);
  }

  @ApiOperation({ summary: 'Demander l acces via token (reste en attente)' })
  @ApiOkResponse({ description: 'Cree une demande en statut PENDING' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('request-access')
  requestAccess(
    @Body() dto: RequestJoinViaTokenDto,
    @CurrentUser() current?: { id: string },
  ) {
    const currentUserId = current?.id;
    return this.service.requestAccessViaToken(dto, currentUserId);
  }
}
