import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class MoveCategoryDto {
  @ApiPropertyOptional({
    description: 'Nouveau parent (UUID) ou null pour racine',
  })
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsUUID()
  newParentId?: string | null;
}
