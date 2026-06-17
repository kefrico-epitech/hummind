import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

const KINDS = ['demo', 'support', 'general'] as const;
export type ContactKindInput = (typeof KINDS)[number];

const ORGANIZATION_TYPES = [
  'SCHOOL_PRIMARY',
  'SCHOOL_SECONDARY',
  'UNIVERSITY',
  'VOCATIONAL_CENTER',
  'TRAINING_ORG',
  'CORPORATE',
  'INDEPENDENT',
  'OTHER',
] as const;
export type OrganizationTypeInput = (typeof ORGANIZATION_TYPES)[number];

const LEARNER_VOLUMES = [
  'UNDER_50',
  'BETWEEN_50_200',
  'BETWEEN_200_1000',
  'OVER_1000',
] as const;
export type LearnerVolumeInput = (typeof LEARNER_VOLUMES)[number];

const PROJECT_HORIZONS = [
  'IMMEDIATE',
  'WITHIN_1_MONTH',
  'WITHIN_3_MONTHS',
  'EXPLORING',
] as const;
export type ProjectHorizonInput = (typeof PROJECT_HORIZONS)[number];

export class CreateContactMessageDto {
  @IsString()
  @IsIn(KINDS as unknown as string[])
  kind!: ContactKindInput;

  // Contact
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsEmail() @MaxLength(200) email!: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(80) role?: string;

  // Organisation
  @IsOptional() @IsString() @MaxLength(160) organizationName?: string;
  @IsOptional()
  @IsString()
  @IsIn(ORGANIZATION_TYPES as unknown as string[])
  organizationType?: OrganizationTypeInput;
  @IsOptional()
  @IsString()
  @IsIn(LEARNER_VOLUMES as unknown as string[])
  learnerVolume?: LearnerVolumeInput;
  @IsOptional() @IsUrl({ require_protocol: false }) @MaxLength(200) website?: string;
  @IsOptional() @IsString() @MaxLength(80) country?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;

  // Projet
  @IsString() @MinLength(5) @MaxLength(4000) message!: string;
  @IsOptional()
  @IsString()
  @IsIn(PROJECT_HORIZONS as unknown as string[])
  horizon?: ProjectHorizonInput;

  // Méta
  @IsOptional() @IsString() @MaxLength(160) source?: string;
}
