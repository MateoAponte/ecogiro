import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity } from '../notification.entity';
import { IsNull, Repository, UpdateResult } from 'typeorm';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Injectable()
export class NotificationsRepositoryService {
  constructor(
    /**
     * Inject Repository
     */
    @InjectRepository(NotificationEntity)
    private readonly repository: Repository<NotificationEntity>,
  ) {}

  async create(input: CreateNotificationDto): Promise<NotificationEntity> {
    const notification = this.repository.create({
      recipient_id: input.recipient_id,
      recovery_id: input.recovery_id ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      read_at: null,
    });
    return this.repository.save(notification);
  }

  async findForRecipient(recipientId: number): Promise<NotificationEntity[]> {
    return this.repository.find({
      where: { recipient_id: recipientId },
      order: { created_at: 'DESC', id: 'DESC' },
      take: 50,
    });
  }

  async countUnread(recipientId: number): Promise<number> {
    return this.repository.countBy({
      recipient_id: recipientId,
      read_at: IsNull(),
    });
  }

  async update(id: string, recipientId: number): Promise<UpdateResult> {
    return this.repository.update(
      { id, recipient_id: recipientId, read_at: IsNull() },
      { read_at: new Date() },
    );
  }

  async findOneBy(
    id: string,
    recipientId: number,
  ): Promise<NotificationEntity | null> {
    return this.repository.findOne({
      where: { id, recipient_id: recipientId },
    });
  }
}
