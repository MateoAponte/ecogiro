import { ApiProperty } from '@nestjs/swagger';
import { MedailResponseDto } from './medail-response.dto';
import { UserMedail } from '../user-medail.entity';
export class UserMedailResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  user_id!: number;
  @ApiProperty({ format: 'uuid' })
  medail_id!: string;
  @ApiProperty()
  earned_at!: Date;
  @ApiProperty({ type: MedailResponseDto })
  medail!: MedailResponseDto;
  static fromEntity(entity: UserMedail): UserMedailResponseDto {
    const dto = new UserMedailResponseDto();
    dto.id = entity.id;
    dto.user_id = entity.user_id;
    dto.medail_id = entity.medail_id;
    dto.earned_at = entity.earned_at;
    dto.medail = MedailResponseDto.fromEntity(entity.medail);
    return dto;
  }
}
