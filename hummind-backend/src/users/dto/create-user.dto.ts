import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlatformRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstname: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastname: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  // Si l’auth gère le hash ailleurs, tu peux garder ce champ optionnel ici:
  @ApiProperty({ minLength: 8 })
  @IsStrongPassword({
    minLength: 8,
    minSymbols: 0,
    minUppercase: 0,
    minNumbers: 0,
    minLowercase: 0,
  })
  password: string;

  @ApiPropertyOptional({ enum: PlatformRole })
  @IsOptional()
  @IsEnum(PlatformRole)
  platformRole?: PlatformRole;
}
