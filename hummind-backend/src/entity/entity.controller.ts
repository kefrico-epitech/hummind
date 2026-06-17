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
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EntityService } from './entity.service';
import { QueryEntityDto } from './dto/query-entity.dto';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { TreeQueryDto } from './dto/tree-query.dto';
import { MoveEntityDto } from './dto/move-entity.dto';
import { CurrentUserId } from '../auth/current-user.decorator';
import { AuthGuard } from '@nestjs/passport'; // ou JwtAuthGuard si tu préfères

@ApiTags('entities')
@UseGuards(AuthGuard('jwt')) // ou @UseGuards(JwtAuthGuard)
@Controller('entities')
export class EntityController {
  constructor(private readonly service: EntityService) {}

  @ApiOperation({ summary: 'Lister MES entités (search + pagination + tri)' })
  @ApiOkResponse({ description: 'Liste paginée' })
  @Get()
  list(@CurrentUserId() userId: string, @Query() q: QueryEntityDto) {
    return this.service.list(userId, q);
  }

  @ApiOperation({ summary: 'Lister MES entités (search + pagination + tri)' })
  @ApiOkResponse({ description: 'Liste paginée' })
  @Get('me')
  listMe(@CurrentUserId() userId: string) {
    return this.service.listRootEntitiesForUser(userId);
  }

  @ApiOperation({ summary: 'Lister les archives (Owner/Admin uniquement)' })
  @Get('archives')
  listArchives(@CurrentUserId() userId: string) {
    return this.service.listArchives(userId);
  }

  @ApiOperation({ summary: 'Créer une entité (optionnel: parentId)' })
  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateEntityDto) {
    return this.service.create(userId, dto);
  }

  @ApiOperation({ summary: 'Détails (sans enfants par défaut)' })
  @Get(':id')
  getOne(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.getOne(userId, id);
  }

  @ApiOperation({ summary: 'Mettre à jour nom/description' })
  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEntityDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @ApiOperation({ summary: 'Archiver une entité (Owner/Admin)' })
  @Patch(':id/archive')
  archive(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.archive(userId, id);
  }

  @ApiOperation({ summary: 'Désarchiver une entité (Owner/Admin)' })
  @Patch(':id/unarchive')
  unarchive(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.unarchive(userId, id);
  }

  @ApiOperation({ summary: 'Supprimer une entité' })
  @Delete(':id')
  remove(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.remove(userId, id);
  }

  // ---- Arborescence ----

  @ApiOperation({ summary: 'Enfants directs (niveau 1)' })
  @Get(':id/children')
  children(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('includeCounts') includeCounts?: string,
  ) {
    return this.service.children(userId, id, includeCounts === 'true');
  }

  @ApiOperation({ summary: 'Arbre descendants (depth/flat/includeCounts)' })
  @Get(':id/tree')
  tree(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() q: TreeQueryDto,
  ) {
    return this.service.tree(userId, id, q);
  }

  @ApiOperation({ summary: 'Ancêtres → racine (breadcrumbs)' })
  @Get(':id/ancestors')
  ancestors(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.ancestors(userId, id);
  }

  @ApiOperation({ summary: 'Déplacer sous un nouveau parent (anti-cycle)' })
  @Post(':id/move')
  move(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: MoveEntityDto,
  ) {
    return this.service.move(userId, id, dto);
  }

  @ApiOperation({ summary: 'Compteurs (children, members, courses)' })
  @Get(':id/counts')
  counts(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.counts(userId, id);
  }

  // ---- Sous-ressources ----

  // @ApiOperation({ summary: 'Lister les membres' })
  // @Get(':id/members')
  // members(@CurrentUserId() userId: string, @Param('id', new ParseUUIDPipe()) id: string) {
  //   return this.service.members(userId, id);
  // }

  // @ApiOperation({ summary: 'Lister les cours' })
  // @Get(':id/courses')
  // courses(@CurrentUserId() userId: string, @Param('id', new ParseUUIDPipe()) id: string) {
  //   return this.service.courses(userId, id);
  // }

  // @ApiOperation({ summary: 'Lister les invitations' })
  // @Get(':id/invitations')
  // invitations(@CurrentUserId() userId: string, @Param('id', new ParseUUIDPipe()) id: string) {
  //   return this.service.invitations(userId, id);
  // }
}
