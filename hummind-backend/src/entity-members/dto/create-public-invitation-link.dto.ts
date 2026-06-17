import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { EntityRoleDto } from './add-member.dto';

export class CreatePublicInvitationLinkDto {
  @ApiPropertyOptional({ enum: EntityRoleDto, default: EntityRoleDto.LEARNER })
  @IsOptional()
  @IsEnum(EntityRoleDto)
  role: EntityRoleDto = EntityRoleDto.LEARNER;
}
