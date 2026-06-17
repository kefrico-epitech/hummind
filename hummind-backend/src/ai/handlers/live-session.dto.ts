import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export type LiveAction = 'START' | 'NEXT' | 'REEXPLAIN' | 'QUIZ' | 'ANSWER';

export class LiveLessonDto {
  @IsString() id!: string;
  @IsString() moduleId!: string;
  @IsString() moduleTitle!: string;
  @IsString() @IsIn(['lesson', 'quiz', 'exercise']) kind!: string;
  @IsString() title!: string;
  @IsOptional() @IsArray() paragraphs?: string[];
  @IsOptional() @IsArray() contextLines?: string[];
  @IsOptional() @IsObject() quiz?: Record<string, unknown> | null;
  @IsOptional() exercisePrompt?: string;
  @IsOptional() exerciseSolution?: string;
}

export class LiveCourseDto {
  @IsString() id!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() domain?: string;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsArray() objectives?: string[];
}

export class LiveAnswerDto {
  @IsOptional() choiceIndex?: number | null;
  @IsOptional() @IsString() text?: string;
}

export class LiveSessionRequestDto {
  @IsString()
  @IsIn(['START', 'NEXT', 'REEXPLAIN', 'QUIZ', 'ANSWER'])
  action!: LiveAction;

  @ValidateNested()
  @Type(() => LiveCourseDto)
  course!: LiveCourseDto;

  @ValidateNested()
  @Type(() => LiveLessonDto)
  lesson!: LiveLessonDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LiveAnswerDto)
  answer?: LiveAnswerDto;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
