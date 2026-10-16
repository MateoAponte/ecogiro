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
  materiales!: string[];

  @ApiProperty({
    type: [String],
    example: ['1. Vacía los envases.', '2. Enjuaga y deja secar.'],
  })
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  preparacion!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  impacto_inmediato!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  daño_ambiental!: string[];

  @ApiProperty({
    type: Number,
    example: 0.045,
    description: 'Visual estimate in kg, not a measured weight',
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  peso_estimado!: number;
}

// Private model envelope. Invalid images use null weight and empty arrays.
export class AnalyzeModelOutputDto extends OmitType(AnalyzeResponseDto, [
  'peso_estimado',
] as const) {
  @ValidateIf((_object, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  peso_estimado!: number | null;

  @IsBoolean()
  es_plastico!: boolean;

  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  motivo_invalido!: string | null;
}
