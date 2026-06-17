import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User cible (UUID)' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ description: 'Entite liee (UUID)' })
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsUUID()
  entityId?: string | null;

  @ApiProperty({ minLength: 2, maxLength: 80 })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  type!: string;

  @ApiProperty({ minLength: 2, maxLength: 150 })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title!: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @ApiPropertyOptional({ description: 'Payload libre JSON' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
