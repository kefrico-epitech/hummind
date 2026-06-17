import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsUUID } from 'class-validator';

export enum BulkActionType {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class BulkActionDto {
  @ApiProperty({ description: 'List of request IDs to process' })
  @IsArray()
  @IsUUID('4', { each: true })
  requestIds: string[];

  @ApiProperty({ enum: BulkActionType, description: 'Action to perform' })
  @IsEnum(BulkActionType)
  action: BulkActionType;
}
