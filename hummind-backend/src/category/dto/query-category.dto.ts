import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class QueryCategoryDto {
  @ApiPropertyOptional({ description: 'Recherche (nom)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par parentId (enfants directs) ou null pour racine',
  })
  @IsOptional()
  @Transform(({ value }: { value: string | null }): string | null =>
    value === 'null' ? null : value,
  )
  @ValidateIf((_obj, value) => value !== null)
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ description: "Tri multi: 'name:asc,createdAt:desc'" })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
  })
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 200 })
  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
  })
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize: number = 20;
}
