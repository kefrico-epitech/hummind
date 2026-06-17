import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class SignInDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() password: string;

  // Optionnel — exigé seulement si l'utilisateur a TOTP activé.
  @ApiPropertyOptional({ description: 'Code TOTP 6 chiffres (si 2FA activé)' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  totpCode?: string;
}
