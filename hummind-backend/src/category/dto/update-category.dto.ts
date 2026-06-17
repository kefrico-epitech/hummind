import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Parent category id (UUID)' })
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({
    description: 'IDs of entities to group in this category',
    type: [String],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  groupIds?: string[];
}
