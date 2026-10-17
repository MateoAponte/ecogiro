import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { NotificationsRepositoryService } from './notifications-repository.service';
import { NotificationsStreamService } from './notifications-stream.service';

@Injectable()
export class NotificationsService {
  constructor(
    /**
     * Inject Notifications Repository
     */
    private readonly notificationsRepository: NotificationsRepositoryService,
    private readonly streams: NotificationsStreamService,
  ) {}

  async create(input: CreateNotificationDto): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepository.create(input);
    const response = NotificationResponseDto.fromEntity(notification);
    this.streams.publish(response);
    return response;
  }

  async findForRecipient(
    recipientId: number,
  ): Promise<NotificationResponseDto[]> {
    const notifications =
      await this.notificationsRepository.findForRecipient(recipientId);
    return notifications.map((notification) =>
      NotificationResponseDto.fromEntity(notification),
    );
  }

  countUnread(recipientId: number): Promise<number> {
    return this.notificationsRepository.countUnread(recipientId);
  }

  async markAsRead(
    id: string,
    recipientId: number,
  ): Promise<NotificationResponseDto> {
    // Only update unread notifications owned by this recipient. The condition
    // preserves the original read timestamp even on repeated/concurrent requests.
    await this.notificationsRepository.update(id, recipientId);

    const notification = await this.notificationsRepository.findOneBy(
      id,
      recipientId,
    );
    if (!notification) throw new NotFoundException('Notification not found');
    return NotificationResponseDto.fromEntity(notification);
  }
}
