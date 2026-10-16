import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

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

  @ApiPropertyOptional({
    example: 'https://www.ecogiro.com/assets/images/rewards/cine.png',
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  @IsNotEmpty()
  @MaxLength(255)
  image_url?: string | null;
}
