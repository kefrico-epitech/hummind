import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryEntityDto {
  @ApiPropertyOptional({ description: 'Recherche (name/description)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par parentId (enfants directs)',
  })
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({
    description:
      'Filtrer par type (ORGANISATION, DEPARTEMENT, SALLE, INDEPENDANT)',
    enum: ['ORGANISATION', 'DEPARTEMENT', 'SALLE', 'INDEPENDANT'],
  })
  @IsOptional()
  @IsString()
  type?: 'ORGANISATION' | 'DEPARTEMENT' | 'SALLE' | 'INDEPENDANT';

  @ApiPropertyOptional({ description: "Tri multi: 'name:asc,createdAt:desc'" })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
  })
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 200 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
  })
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize: number = 20;
}
