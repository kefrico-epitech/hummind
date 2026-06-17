import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CourseGenerateContextDto {
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() objectives?: string[];
  @IsOptional() @IsString() domain?: string;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsString() style?: string;
}

export class CourseGenerateRequestDto {
  @ValidateNested()
  @Type(() => CourseGenerateContextDto)
  context!: CourseGenerateContextDto;

  @IsOptional() @IsString() extractedData?: string;
}
