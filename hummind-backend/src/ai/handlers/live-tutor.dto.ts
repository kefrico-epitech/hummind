import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export type TutorAction = 'INTRO' | 'ASK' | 'PROGRESS' | 'QUIZ_FEEDBACK' | 'EXERCISE_FEEDBACK';

export class LiveTutorCourseDto {
  @IsString() id!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() domain?: string;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsArray() objectives?: string[];
}

export class LiveTutorStepDto {
  @IsString() id!: string;
  @IsString() @IsIn(['lesson', 'quiz', 'exercise']) kind!: string;
  @IsString() title!: string;
  @IsOptional() @IsArray() paragraphs?: string[];
  @IsOptional() @IsObject() quiz?: Record<string, unknown> | null;
  @IsOptional() @IsString() exercisePrompt?: string;
  @IsOptional() @IsString() exerciseSolution?: string;
}

export class LiveTutorLearnerDto {
  @IsOptional() @IsString() message?: string;
  @IsOptional() @IsString() answer?: string;
  @IsOptional() answerIndex?: number | null;
  @IsOptional() @IsString() exerciseAttempt?: string;
}

export class LiveTutorRequestDto {
  @IsString()
  @IsIn(['INTRO', 'ASK', 'PROGRESS', 'QUIZ_FEEDBACK', 'EXERCISE_FEEDBACK'])
  action!: TutorAction;

  @IsOptional() @IsString() language?: string;

  @ValidateNested()
  @Type(() => LiveTutorCourseDto)
  course!: LiveTutorCourseDto;

  @ValidateNested()
  @Type(() => LiveTutorStepDto)
  step!: LiveTutorStepDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LiveTutorStepDto)
  nextStep?: LiveTutorStepDto;

  @IsOptional() progressionEnabled?: boolean;

  @ValidateNested()
  @Type(() => LiveTutorLearnerDto)
  learner!: LiveTutorLearnerDto;
}
