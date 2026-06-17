import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class TreeCategoryQueryDto {
  @ApiPropertyOptional({
    description: 'Profondeur max',
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
  })
  @IsInt()
  @Min(1)
  @Max(20)
  depth?: number;

  @ApiPropertyOptional({ description: 'Retour a plat', default: false })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  flat?: boolean = false;
}
