import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmEmailDto {
  @ApiProperty({ description: 'Email confirmation token (from email link)' })
  @IsString()
  token: string;
}
