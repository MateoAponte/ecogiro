import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { PaginationDto } from './pagination.dto';

// Validate the complete query, including user_id, with whitelist enabled.
export class FindRecoveriesByUserDto extends PaginationDto {
  @ApiProperty({ type: Number, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  user_id!: number;
}
