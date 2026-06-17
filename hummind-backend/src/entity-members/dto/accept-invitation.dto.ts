import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Token reçu par email' })
  @IsString()
  @Length(10, 200)
  token!: string;
}
