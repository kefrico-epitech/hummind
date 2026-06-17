import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export const ALLOWED_IMAGE_SIZES = [
  '1024x1024',
  '1024x1536',
  '1536x1024',
  'auto',
] as const;

export class ImageGenerateRequestDto {
  @IsString() prompt!: string;
  @IsOptional() @IsIn(ALLOWED_IMAGE_SIZES) size?: (typeof ALLOWED_IMAGE_SIZES)[number];
}

export class ImageBatchItemDto {
  @IsOptional() @IsString() id?: string;
  @IsString() prompt!: string;
  @IsOptional() @IsIn(ALLOWED_IMAGE_SIZES) size?: (typeof ALLOWED_IMAGE_SIZES)[number];
}

export class ImageBatchRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ImageBatchItemDto)
  images!: ImageBatchItemDto[];

  @IsOptional() @IsInt() @Min(1) @Max(3) concurrency?: number;
}

export class ImageSearchRequestDto {
  @IsString() query!: string;
  @IsOptional() @IsInt() @Min(1) @Max(12) limit?: number;
}
