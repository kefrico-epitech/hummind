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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { TreeCategoryQueryDto } from './dto/tree-category.dto';
import { MoveCategoryDto } from './dto/move-category.dto';
import { CurrentUserId } from '../auth/current-user.decorator';

@ApiTags('categories')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('entities/:entityId/categories')
export class EntityCategoriesController {
  constructor(private readonly service: CategoryService) {}

  @ApiOperation({ summary: 'Lister les categories d une entite' })
  @ApiOkResponse({ description: 'Liste paginee' })
  @Get()
  list(
    @CurrentUserId() userId: string,
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Query() q: QueryCategoryDto,
  ) {
    return this.service.list(userId, entityId, q);
  }

  @ApiOperation({ summary: 'Creer une categorie' })
  @Post()
  create(
    @CurrentUserId() userId: string,
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.service.create(userId, entityId, dto);
  }
}

@ApiTags('categories')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoryService) {}

  @ApiOperation({ summary: 'Details d une categorie' })
  @Get(':id')
  getOne(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.getOne(userId, id);
  }

  @ApiOperation({ summary: 'Mettre a jour une categorie' })
  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @ApiOperation({ summary: 'Supprimer une categorie' })
  @Delete(':id')
  remove(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.remove(userId, id);
  }

  @ApiOperation({ summary: 'Enfants directs' })
  @Get(':id/children')
  children(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.children(userId, id);
  }

  @ApiOperation({ summary: 'Arbre descendants (depth/flat)' })
  @Get(':id/tree')
  tree(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() q: TreeCategoryQueryDto,
  ) {
    return this.service.tree(userId, id, q);
  }

  @ApiOperation({ summary: 'Ancetres -> racine' })
  @Get(':id/ancestors')
  ancestors(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.ancestors(userId, id);
  }

  @ApiOperation({ summary: 'Deplacer sous un nouveau parent (anti-cycle)' })
  @Post(':id/move')
  move(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: MoveCategoryDto,
  ) {
    return this.service.move(userId, id, dto);
  }
}
