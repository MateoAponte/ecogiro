import { ApiProperty } from '@nestjs/swagger';

export class RecyclingStatsResponseDto {
  @ApiProperty({ example: 5 })
  user_id!: number;

  @ApiProperty({ example: 10 })
  completed_recoveries!: number;

  @ApiProperty({ example: 125.75 })
  recycled_kg!: number;
}
