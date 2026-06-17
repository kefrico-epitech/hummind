import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { LiveSessionHandler } from './handlers/live-session.handler';
import { LiveSessionStreamHandler } from './handlers/live-session-stream.handler';
import { LiveSessionRequestDto } from './handlers/live-session.dto';
import { LiveTutorHandler } from './handlers/live-tutor.handler';
import { LiveTutorRequestDto } from './handlers/live-tutor.dto';
import { CourseGenerateProgressiveHandler } from './handlers/course-generate-progressive.handler';
import { CourseGenerateRequestDto } from './handlers/course-generate-progressive.dto';
import { ImageHandler } from './handlers/image.handler';
import {
  ImageBatchRequestDto,
  ImageGenerateRequestDto,
  ImageSearchRequestDto,
} from './handlers/image.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly liveSession: LiveSessionHandler,
    private readonly liveSessionStream: LiveSessionStreamHandler,
    private readonly liveTutor: LiveTutorHandler,
    private readonly courseGenerate: CourseGenerateProgressiveHandler,
    private readonly image: ImageHandler,
    private readonly prisma: PrismaService,
  ) {}

  @Post('live-session')
  @HttpCode(HttpStatus.OK)
  async runLiveSession(
    @CurrentUser() user: RequestUser,
    @Body() body: LiveSessionRequestDto,
  ) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { firstname: true },
    });
    return this.liveSession.handle({
      userId: user.id,
      firstname: profile?.firstname ?? '',
      body,
    });
  }

  @Post('live-session/stream')
  async streamLiveSession(
    @CurrentUser() user: RequestUser,
    @Body() body: LiveSessionRequestDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { firstname: true },
    });
    await this.liveSessionStream.stream({
      userId: user.id,
      firstname: profile?.firstname ?? '',
      body,
      reply,
    });
  }

  @Post('live-tutor')
  @HttpCode(HttpStatus.OK)
  async runLiveTutor(
    @CurrentUser() user: RequestUser,
    @Body() body: LiveTutorRequestDto,
  ) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { firstname: true },
    });
    return this.liveTutor.handle({
      userId: user.id,
      firstname: profile?.firstname ?? '',
      body,
    });
  }

  @Post('course-generate-progressive')
  @HttpCode(HttpStatus.OK)
  async runCourseGenerate(
    @CurrentUser() user: RequestUser,
    @Body() body: CourseGenerateRequestDto,
  ) {
    return this.courseGenerate.handle({ userId: user.id, body });
  }

  @Post('image-generate')
  @HttpCode(HttpStatus.OK)
  async runImageGenerate(
    @CurrentUser() user: RequestUser,
    @Body() body: ImageGenerateRequestDto,
  ) {
    return this.image.generate({ userId: user.id, body });
  }

  @Post('image-generate-batch')
  @HttpCode(HttpStatus.OK)
  async runImageBatch(
    @CurrentUser() user: RequestUser,
    @Body() body: ImageBatchRequestDto,
  ) {
    return this.image.batch({ userId: user.id, body });
  }

  @Post('image-search')
  @HttpCode(HttpStatus.OK)
  async runImageSearch(
    @CurrentUser() user: RequestUser,
    @Body() body: ImageSearchRequestDto,
  ) {
    return this.image.search({ userId: user.id, body });
  }
}
