export class CreateEntityMemberDto {}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum EntityRoleDto {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  LEARNER = 'LEARNER',
  VIEWER = 'VIEWER',
}

export class AddMemberDto {
  @ApiProperty({ description: 'Email du user à ajouter' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: EntityRoleDto, default: EntityRoleDto.LEARNER })
  @IsEnum(EntityRoleDto)
  role: EntityRoleDto = EntityRoleDto.LEARNER;

  // Optionnel — utilisé uniquement quand le User n'existe pas encore
  // (auto-création avec mot de passe temporaire, cf. Flow v2.0 §6).
  @ApiPropertyOptional({ description: 'Prénom (si compte à créer)' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstname?: string;

  @ApiPropertyOptional({ description: 'Nom (si compte à créer)' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastname?: string;
}
