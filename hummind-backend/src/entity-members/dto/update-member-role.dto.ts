import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EntityRoleDto } from './add-member.dto';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: EntityRoleDto })
  @IsEnum(EntityRoleDto)
  role!: EntityRoleDto;
}
