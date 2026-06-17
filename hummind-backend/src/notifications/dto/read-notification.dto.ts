import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateIf, IsISO8601 } from 'class-validator';

export class ReadNotificationDto {
  @ApiPropertyOptional({
    description: 'Date de lecture (ISO) ou null pour non-lu',
  })
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsISO8601()
  readAt?: string | null;
}
