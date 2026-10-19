import { Injectable, Logger } from '@nestjs/common';
import {
  catchError,
  concatMap,
  defer,
  EMPTY,
  Observable,
  Subscription,
} from 'rxjs';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationsService } from '../providers/notifications.service';

@Injectable()
export class SubscriptionFactory {
  private readonly logger = new Logger(SubscriptionFactory.name);

  constructor(private readonly notifications: NotificationsService) {}

  create<T>(
    content: (event: T) => CreateNotificationDto,
    events: Observable<T>,
  ): Subscription {
    return events
      .pipe(
        concatMap((event) =>
          // Build the content when the event arrives. Capture mapping and save errors.
          defer(() => this.notifications.create(content(event))).pipe(
            // Keep listening even if creating one notification fails.
            catchError((error: unknown) => {
              this.logger.error(
                'Could not create notification from event',
                error instanceof Error ? error.stack : undefined,
              );
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe();
  }
}
