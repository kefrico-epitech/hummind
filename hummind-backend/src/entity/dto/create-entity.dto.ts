import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateEntityDto {
  @ApiProperty({ minLength: 2, maxLength: 150 })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Si défini, rattache à un parent (UUID). null => racine',
  })
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null) // autorise null sans valider UUID
  @IsUUID()
  parentId?: string | null;

  @ApiProperty({
    description:
      'Type d entité (ORGANISATION, DEPARTEMENT, SALLE, INDEPENDANT)',
    enum: ['ORGANISATION', 'DEPARTEMENT', 'SALLE', 'INDEPENDANT'],
  })
  @IsString()
  type!: 'ORGANISATION' | 'DEPARTEMENT' | 'SALLE' | 'INDEPENDANT';
}
