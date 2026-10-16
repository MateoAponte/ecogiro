import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class UpdateTeamDto {
  @ApiProperty({
    type: 'array',
    isArray: true,
    items: {
      type: 'number',
    },
    description: 'Team of pokemon ids',
    example: [80, 102, 124, 308, 344, 655],
  })
  @IsArray()
  @IsNumber({ allowNaN: false }, { each: true })
  team: number[];
}
