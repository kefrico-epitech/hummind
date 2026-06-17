import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const STATUSES = ['INVITED', 'ACTIVE', 'DISABLED', 'BANNED'] as const;
const PLATFORM_ROLES = ['ROOT', 'MEMBER'] as const;

export class ListAdminUsersQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(STATUSES as unknown as string[])
  status?: (typeof STATUSES)[number];

  @IsOptional()
  @IsString()
  @IsIn(PLATFORM_ROLES as unknown as string[])
  platformRole?: (typeof PLATFORM_ROLES)[number];

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
  pageSize: number = 25;
}

export class UpdateAdminUserStatusDto {
  @IsString()
  @IsIn(['ACTIVE', 'DISABLED', 'BANNED'] as string[])
  status!: 'ACTIVE' | 'DISABLED' | 'BANNED';

  @IsOptional() @IsString() statusNote?: string;
}

export class ListAuditLogQueryDto {
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() actorId?: string;
  @IsOptional() @IsString() targetType?: string;
  @IsOptional() @IsString() targetId?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize: number = 50;
}
