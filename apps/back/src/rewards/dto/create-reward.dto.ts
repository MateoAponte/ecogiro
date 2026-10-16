import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateRewardDto {
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

  @ApiProperty({ example: 500, minimum: 0 })
  @IsInt()
  @Min(0)
  required_points!: number;
}
