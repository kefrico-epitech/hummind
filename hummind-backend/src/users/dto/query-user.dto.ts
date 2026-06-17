import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlatformRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class QueryUserDto {
  @ApiPropertyOptional({
    description: 'Recherche (firstname | lastname | email)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PlatformRole })
  @IsOptional()
  @IsEnum(PlatformRole)
  platformRole?: PlatformRole;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => Number(value))
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'firstname', 'lastname', 'email'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'firstname', 'lastname', 'email'])
  sortBy?: 'createdAt' | 'updatedAt' | 'firstname' | 'lastname' | 'email' =
    'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
