import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../notification.entity';

// The backend supplies the recipient when handling a recovery event.
export class CreateNotificationDto {
  @ApiProperty({ type: Number, minimum: 1, example: 7 })
  @IsInt()
  @Min(1)
  recipient_id!: number;

  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  recovery_id?: string | null;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.RECOVERY_ACCEPTED,
  })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ maxLength: 150, example: 'Recolección aceptada' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title!: string;

  @ApiProperty({
    maxLength: 500,
    example: 'Un recuperador aceptó tu solicitud.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message!: string;
}
