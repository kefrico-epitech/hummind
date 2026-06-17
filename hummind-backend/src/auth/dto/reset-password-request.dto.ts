import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResetPasswordRequestDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email: string;
}
