import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class GoogleSignInDto {
  @ApiProperty({
    description: 'Google ID token returned by Google Identity Services',
  })
  @IsString()
  @MinLength(10)
  credential: string;
}
