import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PokemonPaginationDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit: number;

  @IsString()
  @IsOptional()
  filter: string;

  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => value.split(','))
  type: string[];
}
