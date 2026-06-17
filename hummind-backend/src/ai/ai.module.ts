import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { OpenAiClient } from './openai.client';
import { MemoryService } from './memory/memory.service';
import { AffectiveService } from './memory/affective.service';
import { MoodDetectorService } from './memory/mood-detector.service';
import { SummarizerService } from './memory/summarizer.service';
import { UsageService } from './usage/usage.service';
import { LiveSessionHandler } from './handlers/live-session.handler';
import { LiveSessionStreamHandler } from './handlers/live-session-stream.handler';
import { LiveTutorHandler } from './handlers/live-tutor.handler';
import { CourseGenerateProgressiveHandler } from './handlers/course-generate-progressive.handler';
import { ImageHandler } from './handlers/image.handler';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AiController],
  providers: [
    OpenAiClient,
    MemoryService,
    AffectiveService,
    MoodDetectorService,
    SummarizerService,
    UsageService,
    LiveSessionHandler,
    LiveSessionStreamHandler,
    LiveTutorHandler,
    CourseGenerateProgressiveHandler,
    ImageHandler,
  ],
  exports: [
    OpenAiClient,
    MemoryService,
    AffectiveService,
    MoodDetectorService,
    SummarizerService,
    UsageService,
  ],
})
export class AiModule {}
