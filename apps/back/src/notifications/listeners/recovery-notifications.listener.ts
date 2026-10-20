import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Subscription } from 'rxjs';
import { RecoveryEventsService } from '../../collections/events/recovery-events.service';
import { NotificationType } from '../notification.entity';
import { SubscriptionFactory } from '../helpers/subscriptionFactory';
import { LISTENERS_CONTENT } from '../constants/Listeners';

@Injectable()
export class RecoveryNotificationsListener
  implements OnModuleInit, OnModuleDestroy
{
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly recoveryEvents: RecoveryEventsService,
    private readonly factory: SubscriptionFactory,
  ) {}

  onModuleInit(): void {
    this.subscriptions.add(
      this.factory.create(
        (event) => ({
          recipient_id: event.user_id,
          recovery_id: event.recovery_id,
          type: NotificationType.RECOVERY_COMPLETED,
          title: 'Recolección completada',
          message:
            'El recuperador completó tu recolección. ¡Gracias por reciclar!',
        }),
        this.recoveryEvents.completed$,
      ),
    );
    this.subscriptions.add(
      this.factory.create(
        (event) => ({
          recipient_id:
            event.canceled_by === event.user_id
              ? event.agent_id
              : event.user_id,
          recovery_id: event.recovery_id,
          type: NotificationType.RECOVERY_CANCELED,
          title: 'Recolección cancelada',
          message:
            event.canceled_by === event.user_id
              ? 'El ciudadano canceló la recolección que habías aceptado.'
              : 'El recuperador canceló tu recolección aceptada.',
        }),
        this.recoveryEvents.canceled$,
      ),
    );
    this.subscriptions.add(
      this.factory.create(
        (event) => ({
          recipient_id: event.user_id,
          recovery_id: event.recovery_id,
          ...LISTENERS_CONTENT[NotificationType.RECOVERY_ACCEPTED],
        }),
        this.recoveryEvents.accepted$,
      ),
    );
    this.subscriptions.add(
      this.factory.create(
        (event) => ({
          recipient_id: event.user_id,
          recovery_id: event.recovery_id,
          ...LISTENERS_CONTENT[NotificationType.RECOVERY_REJECTED],
        }),
        this.recoveryEvents.rejected$,
      ),
    );
  }

  onModuleDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
