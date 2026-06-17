import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SignInDto {
  @ApiProperty() @IsEmail()
  email!: string;

  @ApiProperty() @IsString() @MinLength(8)
  password!: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10)
  locale?: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @MinLength(8)
  currentPassword!: string;

  @ApiProperty() @IsString() @MinLength(8)
  newPassword!: string;
}
