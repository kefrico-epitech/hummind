import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 150 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  // --- Nouveaux champs ---

  @ApiPropertyOptional({
    type: Object,
    description: 'Contenu riche du cours en JSON',
  })
  @IsOptional()
  content?: Record<string, any>; // ✅ champ optionnel

  @ApiPropertyOptional({ enum: ['STEP_BY_STEP', 'HYBRID', 'AI_ONLY'] })
  @IsOptional()
  @IsEnum(['STEP_BY_STEP', 'HYBRID', 'AI_ONLY'])
  mode?: 'STEP_BY_STEP' | 'HYBRID' | 'AI_ONLY';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsString({ each: true })
  objectives?: string[];

  @ApiPropertyOptional({ enum: ['UNLIMITED', 'LIMITED', 'PUBLIC'] })
  @IsOptional()
  @IsEnum(['UNLIMITED', 'LIMITED', 'PUBLIC'])
  visibility?: 'UNLIMITED' | 'LIMITED' | 'PUBLIC';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  link?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

  @ApiPropertyOptional({
    description: "Liste d'IDs de catégories (remplace parentId[])",
    type: [String],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}
