import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class MoveEntityDto {
  @ApiPropertyOptional({ description: 'Nouveau parent; null => racine' })
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsUUID()
  newParentId?: string | null;
}
