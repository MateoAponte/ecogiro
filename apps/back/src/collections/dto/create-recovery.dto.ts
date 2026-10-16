import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Status } from '../enums/Status.enum';
import { Type } from 'class-transformer';

export class CreateRecoveryDto {
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
