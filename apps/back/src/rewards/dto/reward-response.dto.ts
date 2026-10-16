import { ApiProperty } from '@nestjs/swagger';
import { Reward } from '../reward.entity';

export class RewardResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  description!: string;
  @ApiProperty()
  required_points!: number;
  static fromEntity(entity: Reward): RewardResponseDto {
    const dto = new RewardResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.required_points = entity.required_points;
    return dto;
  }
}
