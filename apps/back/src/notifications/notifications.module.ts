import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RecoveryModule } from '../collections/recovery.module';
import { NotificationEntity } from './notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsStreamService } from './providers/notifications-stream.service';
import { NotificationsService } from './providers/notifications.service';
import { NotificationsRepositoryService } from './providers/notifications-repository.service';
import { RecoveryNotificationsListener } from './listeners/recovery-notifications.listener';
import { SubscriptionFactory } from './helpers/subscriptionFactory';

@Module({
  imports: [
    AuthModule,
    RecoveryModule,
    TypeOrmModule.forFeature([NotificationEntity]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsStreamService,
    NotificationsService,
    NotificationsRepositoryService,
    RecoveryNotificationsListener,
    SubscriptionFactory,
  ],
})
export class NotificationsModule {}
