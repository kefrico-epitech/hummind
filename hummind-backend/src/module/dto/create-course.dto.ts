import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
  registerDecorator,
  type ValidationOptions,
  type ValidationArguments,
} from 'class-validator';

function IsValidCourseContent(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidCourseContent',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (value === undefined || value === null) return true;
          if (typeof value !== 'object' || Array.isArray(value)) return false;

          const json = JSON.stringify(value);
          // Reject payloads larger than 5MB
          if (json.length > 5 * 1024 * 1024) return false;

          const record = value as Record<string, unknown>;
          // If modules exist, they must be an array
          if ('modules' in record && !Array.isArray(record.modules))
            return false;

          return true;
        },
        defaultMessage() {
          return 'content must be a valid course JSON object (max 5MB, modules must be an array)';
        },
      },
    });
  };
}

export class CreateCourseDto {
  @ApiProperty({ minLength: 2, maxLength: 150 })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Entité parente (UUID)' })
  @IsUUID()
  entityId!: string;

  // --- Nouveaux champs ---

  @ApiPropertyOptional({
    type: Object,
    description: 'Contenu riche du cours en JSON',
  })
  @IsOptional()
  @IsValidCourseContent()
  content?: Record<string, any>;

  @ApiPropertyOptional({
    enum: ['STEP_BY_STEP', 'HYBRID', 'AI_ONLY'],
    default: 'STEP_BY_STEP',
  })
  @IsOptional()
  @IsEnum(['STEP_BY_STEP', 'HYBRID', 'AI_ONLY'])
  mode?: 'STEP_BY_STEP' | 'HYBRID' | 'AI_ONLY';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsString({ each: true })
  objectives?: string[];

  @ApiPropertyOptional({
    enum: ['UNLIMITED', 'LIMITED', 'PUBLIC'],
    default: 'UNLIMITED',
  })
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

  @ApiPropertyOptional({
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT',
  })
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
