import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BanMemberDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
