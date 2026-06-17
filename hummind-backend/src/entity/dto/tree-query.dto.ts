import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class TreeQueryDto {
  @ApiPropertyOptional({ description: 'Limiter la profondeur', example: 5 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
  })
  @IsInt()
  @Min(0)
  @Max(15)
  depth?: number;

  @ApiPropertyOptional({
    description: 'Retourner une liste plate',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true' || value === 1 || value === '1')
      return true;
    if (value === false || value === 'false' || value === 0 || value === '0')
      return false;
    return undefined;
  })
  @IsBoolean()
  flat?: boolean;

  @ApiPropertyOptional({
    description: 'Inclure les compteurs enfants',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true' || value === 1 || value === '1')
      return true;
    if (value === false || value === 'false' || value === 0 || value === '0')
      return false;
    return undefined;
  })
  @IsBoolean()
  includeCounts?: boolean;
}
