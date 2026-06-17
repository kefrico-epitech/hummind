import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { EntityRoleDto } from './add-member.dto';

export class InviteMemberDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: EntityRoleDto, default: EntityRoleDto.LEARNER })
  @IsEnum(EntityRoleDto)
  role: EntityRoleDto = EntityRoleDto.LEARNER;
}
