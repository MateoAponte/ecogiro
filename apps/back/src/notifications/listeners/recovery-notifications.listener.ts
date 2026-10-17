import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { catchError, concatMap, defer, EMPTY, Subscription } from 'rxjs';
import { RecoveryEventsService } from '../../collections/events/recovery-events.service';
import { NotificationType } from '../notification.entity';
import { NotificationsService } from '../providers/notifications.service';

@Injectable()
export class RecoveryNotificationsListener
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RecoveryNotificationsListener.name);
  private subscription?: Subscription;

  constructor(
    private readonly recoveryEvents: RecoveryEventsService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.subscription = this.recoveryEvents.accepted$
      .pipe(
        // Process one acceptance at a time. defer also captures synchronous errors.
        concatMap((event) =>
          defer(() =>
            this.notifications.create({
              recipient_id: event.user_id,
              recovery_id: event.recovery_id,
              type: NotificationType.RECOVERY_ACCEPTED,
              title: 'Recolección aceptada',
              message: 'Un recuperador aceptó tu solicitud de recolección.',
            }),
          ).pipe(
            // Catch inside concatMap: one failed save must not close the listener.
            catchError((error: unknown) => {
              this.logger.error(
                `Could not create acceptance notification for recovery ${event.recovery_id}`,
                error instanceof Error ? error.stack : undefined,
              );
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe();
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
