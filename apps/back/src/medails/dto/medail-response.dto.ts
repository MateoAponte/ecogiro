import { ApiProperty } from '@nestjs/swagger';
import { Medail } from '../medail.entity';
import { MedailCondition } from '../enums/medail-condition.enum';
export class MedailResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  description!: string;
  @ApiProperty({ enum: MedailCondition })
  condition_type!: MedailCondition;
  @ApiProperty()
  condition_value!: number;
  static fromEntity(entity: Medail): MedailResponseDto {
    const dto = new MedailResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.condition_type = entity.condition_type;
    dto.condition_value = entity.condition_value;
    return dto;
  }
}
