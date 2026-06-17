import {
  IsEmail,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

// ----------------------------------------------------------------------------
// OWNER side — manage PublicJoinLink of a salle
// ----------------------------------------------------------------------------

export class CreatePublicJoinLinkDto {
  @IsString()
  entityId!: string; // doit être une Entity de type SALLE

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;
}

export class UpdatePublicJoinLinkDto {
  @IsOptional()
  enabled?: boolean;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number | null;
}

// ----------------------------------------------------------------------------
// Public side — apprenant qui rejoint
// ----------------------------------------------------------------------------

export class JoinSignupDto {
  @IsString() @MinLength(1) @MaxLength(80) firstname!: string;
  @IsString() @MinLength(1) @MaxLength(80) lastname!: string;
  @IsEmail() @MaxLength(200) email!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
}

export class VerifyEmailDto {
  @IsString() userId!: string;
  @IsString() @MinLength(6) @MaxLength(6) code!: string;
}
