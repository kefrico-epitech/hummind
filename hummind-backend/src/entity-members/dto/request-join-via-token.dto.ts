import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RequestJoinViaTokenDto {
  @ApiProperty({ description: 'Token du lien public d invitation' })
  @IsString()
  @Length(10, 200)
  token!: string;
}
