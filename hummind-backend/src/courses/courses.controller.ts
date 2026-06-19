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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import type { AuthedRequest } from '../auth/types';
import {
  CreateBlockDto,
  CreateCourseDto,
  CreateDocumentDto,
  CreateLessonDto,
  CreateModuleDto,
  GenerateCourseDto,
  GenerateLessonDto,
  GenerateOutlineDto,
  ReorderDto,
  UpdateBlockDto,
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateModuleDto,
} from './dto/courses.dto';
import { CoursesService } from './courses.service';

@ApiTags('courses')
@UseGuards(JwtAuthGuard)
@Roles(Role.ROOT, Role.ADMIN)
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  list(@Query('entityId') entityId?: string) {
    return this.courses.list(entityId);
  }

  @Post()
  create(@CurrentUser() userId: string, @Req() req: FastifyRequest & AuthedRequest, @Body() dto: CreateCourseDto) {
    return this.courses.create(userId, req.userRole, dto);
  }

  @Get(':courseId')
  findOne(@Param('courseId', new ParseUUIDPipe()) courseId: string) {
    return this.courses.findOne(courseId);
  }

  @Patch(':courseId')
  update(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.courses.update(userId, req.userRole, courseId, dto);
  }

  @Delete(':courseId')
  remove(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
  ) {
    return this.courses.remove(userId, req.userRole, courseId);
  }

  @Post(':courseId/archive')
  archive(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
  ) {
    return this.courses.archive(userId, req.userRole, courseId);
  }

  @Post(':courseId/publish')
  publish(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
  ) {
    return this.courses.publish(userId, req.userRole, courseId);
  }

  @Post(':courseId/unpublish')
  unpublish(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
  ) {
    return this.courses.unpublish(userId, req.userRole, courseId);
  }

  @Post(':courseId/modules')
  createModule(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Body() dto: CreateModuleDto,
  ) {
    return this.courses.createModule(userId, req.userRole, courseId, dto);
  }

  @Post(':courseId/modules/reorder')
  reorderModules(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Body() dto: ReorderDto,
  ) {
    return this.courses.reorderModules(userId, req.userRole, courseId, dto);
  }

  @Patch('modules/:moduleId')
  updateModule(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('moduleId', new ParseUUIDPipe()) moduleId: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.courses.updateModule(userId, req.userRole, moduleId, dto);
  }

  @Delete('modules/:moduleId')
  deleteModule(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('moduleId', new ParseUUIDPipe()) moduleId: string,
  ) {
    return this.courses.deleteModule(userId, req.userRole, moduleId);
  }

  @Post('modules/:moduleId/lessons')
  createLesson(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('moduleId', new ParseUUIDPipe()) moduleId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.courses.createLesson(userId, req.userRole, moduleId, dto);
  }

  @Post('modules/:moduleId/lessons/generate')
  generateLesson(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('moduleId', new ParseUUIDPipe()) moduleId: string,
    @Body() dto: GenerateLessonDto,
  ) {
    return this.courses.generateLesson(userId, req.userRole, moduleId, dto);
  }

  @Post('modules/:moduleId/lessons/reorder')
  reorderLessons(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('moduleId', new ParseUUIDPipe()) moduleId: string,
    @Body() dto: ReorderDto,
  ) {
    return this.courses.reorderLessons(userId, req.userRole, moduleId, dto);
  }

  @Patch('lessons/:lessonId')
  updateLesson(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.courses.updateLesson(userId, req.userRole, lessonId, dto);
  }

  @Delete('lessons/:lessonId')
  deleteLesson(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
  ) {
    return this.courses.deleteLesson(userId, req.userRole, lessonId);
  }

  @Post('lessons/:lessonId/blocks')
  createBlock(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Body() dto: CreateBlockDto,
  ) {
    return this.courses.createBlock(userId, req.userRole, lessonId, dto);
  }

  @Post('lessons/:lessonId/blocks/reorder')
  reorderBlocks(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Body() dto: ReorderDto,
  ) {
    return this.courses.reorderBlocks(userId, req.userRole, lessonId, dto);
  }

  @Patch('blocks/:blockId')
  updateBlock(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('blockId', new ParseUUIDPipe()) blockId: string,
    @Body() dto: UpdateBlockDto,
  ) {
    return this.courses.updateBlock(userId, req.userRole, blockId, dto);
  }

  @Delete('blocks/:blockId')
  deleteBlock(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('blockId', new ParseUUIDPipe()) blockId: string,
  ) {
    return this.courses.deleteBlock(userId, req.userRole, blockId);
  }

  @Post(':courseId/documents')
  createDocument(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.courses.createDocument(userId, req.userRole, courseId, dto);
  }

  @Delete('documents/:documentId')
  deleteDocument(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
  ) {
    return this.courses.deleteDocument(userId, req.userRole, documentId);
  }

  @Post(':courseId/ai/generate-outline')
  generateOutline(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Body() dto: GenerateOutlineDto,
  ): Promise<unknown> {
    return this.courses.generateOutline(userId, req.userRole, courseId, dto);
  }

  @Post(':courseId/ai/generate-course')
  generateCourse(
    @CurrentUser() userId: string,
    @Req() req: FastifyRequest & AuthedRequest,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Body() dto: GenerateCourseDto,
  ): Promise<unknown> {
    return this.courses.generateCourse(userId, req.userRole, courseId, dto);
  }
}
