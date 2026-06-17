import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ReadAllNotificationsDto {
  @ApiPropertyOptional({ description: 'Filtrer par entityId' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par type' })
  @IsOptional()
  @IsString()
  type?: string;
}
