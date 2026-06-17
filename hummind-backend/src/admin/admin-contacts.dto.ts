import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const STATUSES = ['NEW', 'IN_PROGRESS', 'ANSWERED', 'ARCHIVED'] as const;
const KINDS = ['DEMO', 'SUPPORT', 'GENERAL'] as const;

export class ListContactsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(STATUSES as unknown as string[])
  status?: (typeof STATUSES)[number];

  @IsOptional()
  @IsString()
  @IsIn(KINDS as unknown as string[])
  kind?: (typeof KINDS)[number];

  @IsOptional() @IsString() search?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}

export class UpdateContactStatusDto {
  @IsString()
  @IsIn(STATUSES as unknown as string[])
  status!: (typeof STATUSES)[number];
}
