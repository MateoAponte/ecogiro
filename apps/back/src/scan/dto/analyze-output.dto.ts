import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class AnalyzeResponseDto {
  @ApiProperty({
    type: [String],
    example: ['2 botellas plásticas transparentes; resina no confirmada'],
  })
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  materials!: string[];

  @ApiProperty({
    type: [String],
    example: ['1. Vacía los envases.', '2. Enjuaga y deja secar.'],
  })
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  preparation!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  impact!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  environmental_damage!: string[];

  @ApiProperty({
    type: Number,
    example: 0.045,
    description: 'Visual estimate in kg, not a measured weight',
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  weight_estimate!: number;
}

// Private model envelope. Invalid images use null weight and empty arrays.
export class AnalyzeModelOutputDto extends OmitType(AnalyzeResponseDto, [
  'weight_estimate',
] as const) {
  @ValidateIf((_object, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  weight_estimate!: number | null;

  @IsBoolean()
  is_plastic!: boolean;

  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  reason_invalid!: string | null;
}
