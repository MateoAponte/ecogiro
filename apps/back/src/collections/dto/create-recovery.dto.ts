import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Status } from '../enums/Status.enum';
import { Type } from 'class-transformer';

export class CreateRecoveryDto {
  @ApiPropertyOptional({
    type: Number,
    description:
      'Actual recycled weight in kilograms, up to three decimal places',
    example: 12.5,
    default: 0,
    minimum: 0,
    maximum: 999999999.999,
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999999999.999)
  recycled_kg?: number;

  @ApiProperty({
    type: 'string',
    description: 'scheduled date to recovery',
    example: '2022-01-01T00:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  scheduled_date: Date;

  @ApiProperty({
    type: 'string',
    description: 'description of recovery',
    example: 'description',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    type: 'string',
    description: 'address of recovery',
    example: 'address',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'comments of recovery',
    example: 'comments',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  comments: string;

  @ApiProperty({
    type: 'number',
    description: 'status of recovery',
    example: 1,
  })
  @IsEnum(Status)
  status: Status;

  @ApiProperty({
    type: 'number',
    description: 'user id',
    example: 1,
  })
  @IsNumber()
  user_id: number;
}
