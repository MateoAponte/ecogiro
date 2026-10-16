import { User } from 'src/user/user.entity';
import { Status } from '../enums/Status.enum';
import { Recovery } from '../recovery.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecoveryResponseDto {
  @ApiProperty({
    example: 'uuid',
    description: 'Recovery UUID by Recovery',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    example: '2022-01-01T00:00:00.000Z',
    description: 'scheduled date to recovery',
    type: 'string',
  })
  scheduled_date: Date;

  @ApiProperty({
    example: 'description',
    description: 'description of recovery',
    type: 'string',
  })
  description: string;

  @ApiProperty({
    example: 'address',
    description: 'address of recovery',
    type: 'string',
  })
  address: string;

  @ApiPropertyOptional({
    example: 'comments',
    description: 'comments about the recovery',
    type: 'string',
  })
  comments: string;

  @ApiProperty({
    example: 1,
    description: 'status of recovery',
    type: 'number',
  })
  status: Status;

  @ApiProperty({
    example: 1,
    description: 'User ID',
    type: 'number',
  })
  user_id: number;

  static fromEntity(recovery: Recovery): RecoveryResponseDto {
    const dto = new RecoveryResponseDto();
    dto.id = recovery.id;
    dto.scheduled_date = recovery.scheduled_date;
    dto.description = recovery.description;
    dto.address = recovery.address;
    dto.comments = recovery.comments;
    dto.status = recovery.status;
    dto.user_id = recovery.user_id;
    return dto;
  }
}
