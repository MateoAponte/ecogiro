import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MedailCondition } from '../enums/medail-condition.enum';
export class CreateMedailDto {
  @ApiProperty({ example: 'Primer logro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
  @ApiProperty({ example: 'Descripción del logro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description!: string;

  @ApiProperty({ enum: MedailCondition, example: MedailCondition.ECO_POINTS })
  @IsEnum(MedailCondition)
  condition_type!: MedailCondition;
  @ApiProperty({ example: 500, minimum: 1 })
  @IsInt()
  @Min(1)
  condition_value!: number;
}
