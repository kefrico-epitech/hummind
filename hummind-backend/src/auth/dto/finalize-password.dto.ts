import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class FinalizePasswordDto {
  @ApiProperty({ description: 'JWT temporaire émis lors du signin avec mdp temp' })
  @IsString()
  @MaxLength(2048)
  tempToken!: string;

  @ApiProperty({ description: 'Nouveau mot de passe (8 caractères minimum)' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
