import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LearnerService } from './learner.service';
import { CurrentUserId } from '../auth/current-user.decorator';

@ApiTags('learner')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('learner')
export class LearnerController {
  constructor(private readonly learnerService: LearnerService) {}

  // ════════════════════════════════════════
  // Dashboard
  // ════════════════════════════════════════

  @Get('dashboard')
  @ApiOperation({ summary: 'Get learner dashboard with progress' })
  async getDashboard(@CurrentUserId() userId: string) {
    return this.learnerService.getDashboard(userId);
  }

  @Get('org/:orgId')
  @ApiOperation({ summary: 'Get single organisation detail for learner' })
  async getOrgDetail(
    @CurrentUserId() userId: string,
    @Param('orgId') orgId: string,
  ) {
    const org = await this.learnerService.getOrgDetail(userId, orgId);
    if (!org) throw new NotFoundException('Organisation introuvable');
    return org;
  }

  // ════════════════════════════════════════
  // Progress
  // ════════════════════════════════════════

  @Get('progress/:courseId')
  @ApiOperation({ summary: 'Get progress for a specific course' })
  async getProgress(
    @CurrentUserId() userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.learnerService.getProgress(userId, courseId);
  }

  @Post('progress/:courseId/start')
  @ApiOperation({ summary: 'Start a course (create progress if needed)' })
  async startCourse(
    @CurrentUserId() userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.learnerService.startCourse(userId, courseId);
  }

  @Post('progress/:courseId/block/:blockId')
  @ApiOperation({ summary: 'Mark a block as completed' })
  async completeBlock(
    @CurrentUserId() userId: string,
    @Param('courseId') courseId: string,
    @Param('blockId') blockId: string,
    @Body()
    body: {
      quizCorrect?: boolean;
      isExercise?: boolean;
      lastStepId?: string;
    },
  ) {
    return this.learnerService.completeBlock(userId, courseId, blockId, body);
  }

  @Post('progress/:courseId/step')
  @ApiOperation({ summary: 'Update last step for resume' })
  async updateLastStep(
    @CurrentUserId() userId: string,
    @Param('courseId') courseId: string,
    @Body() body: { lastStepId: string },
  ) {
    return this.learnerService.updateLastStep(userId, courseId, body.lastStepId);
  }

  // ════════════════════════════════════════
  // Sessions (conversation persistence per module)
  // ════════════════════════════════════════

  @Get('session/:courseId')
  @ApiOperation({ summary: 'Get all module sessions for a course' })
  async getSessions(
    @CurrentUserId() userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.learnerService.getSessions(userId, courseId);
  }

  @Put('session/:courseId/:moduleId')
  @ApiOperation({ summary: 'Save/update a module session (debounced from frontend)' })
  async saveSession(
    @CurrentUserId() userId: string,
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body()
    body: {
      messages?: unknown[];
      quizAnswers?: Record<string, unknown>;
      exerciseDrafts?: Record<string, string>;
      exerciseEvaluations?: Record<string, string>;
      completedStepIds?: string[];
      lastStepId?: string;
    },
  ) {
    return this.learnerService.saveSession(userId, courseId, moduleId, body);
  }

  // ════════════════════════════════════════
  // Notes
  // ════════════════════════════════════════

  @Get('notes/:courseId')
  @ApiOperation({ summary: 'Get all notes for a course' })
  async getNotes(
    @CurrentUserId() userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.learnerService.getNotes(userId, courseId);
  }

  @Post('notes/:courseId')
  @ApiOperation({ summary: 'Create a note' })
  async createNote(
    @CurrentUserId() userId: string,
    @Param('courseId') courseId: string,
    @Body()
    body: {
      content: string;
      moduleId?: string;
      stepId?: string;
    },
  ) {
    return this.learnerService.createNote(userId, courseId, body);
  }

  @Patch('notes/:noteId')
  @ApiOperation({ summary: 'Update a note' })
  async updateNote(
    @CurrentUserId() userId: string,
    @Param('noteId') noteId: string,
    @Body() body: { content: string },
  ) {
    const result = await this.learnerService.updateNote(userId, noteId, body.content);
    if (!result) throw new NotFoundException('Note introuvable');
    return result;
  }

  @Delete('notes/:noteId')
  @ApiOperation({ summary: 'Delete a note' })
  async deleteNote(
    @CurrentUserId() userId: string,
    @Param('noteId') noteId: string,
  ) {
    const result = await this.learnerService.deleteNote(userId, noteId);
    if (!result) throw new NotFoundException('Note introuvable');
    return result;
  }
}
