import { ApiProperty } from '@nestjs/swagger';
import { NotificationEntity, NotificationType } from '../notification.entity';

export class NotificationResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: Number, example: 7 })
  recipient_id!: number;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  recovery_id!: string | null;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ maxLength: 150 })
  title!: string;

  @ApiProperty({ maxLength: 500 })
  message!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  read_at!: Date | null;

  static fromEntity(notification: NotificationEntity): NotificationResponseDto {
    const dto = new NotificationResponseDto();
    dto.id = notification.id;
    dto.recipient_id = notification.recipient_id;
    dto.recovery_id = notification.recovery_id;
    dto.type = notification.type;
    dto.title = notification.title;
    dto.message = notification.message;
    dto.created_at = notification.created_at;
    dto.read_at = notification.read_at;
    return dto;
  }
}
