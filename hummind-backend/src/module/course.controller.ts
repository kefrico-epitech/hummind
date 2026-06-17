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
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUserId } from '../auth/current-user.decorator';

@ApiTags('courses')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('courses')
export class CourseController {
  constructor(private readonly service: CourseService) {}

  @ApiOperation({ summary: 'Lister les cours' })
  @ApiOkResponse({ description: 'Liste paginée' })
  @Get()
  list(@Query() q: QueryCourseDto) {
    return this.service.list(q);
  }

  @ApiOperation({ summary: "Lister les cours d'une entite" })
  @ApiOkResponse({ description: 'Liste paginee' })
  @Get('entity/:entityId')
  listByEntity(
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
    @Query() q: QueryCourseDto,
  ) {
    return this.service.listByEntity(entityId, q);
  }

  @ApiOperation({ summary: 'Créer un cours' })
  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateCourseDto) {
    return this.service.create(userId, dto);
  }

  @ApiOperation({ summary: 'Détails d’un cours' })
  @Get(':id')
  getOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getOne(id);
  }

  @ApiOperation({ summary: 'Mettre à jour un cours' })
  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @ApiOperation({ summary: 'Supprimer un cours' })
  @Delete(':id')
  remove(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.remove(userId, id);
  }
}
