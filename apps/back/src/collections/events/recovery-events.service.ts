import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { RecoveryAcceptedEvent } from './recovery-accepted.event';

@Injectable()
export class RecoveryEventsService implements OnModuleDestroy {
  private readonly acceptedSubject = new Subject<RecoveryAcceptedEvent>();

  // Consumers can subscribe, but only this service can publish into the Subject.
  readonly accepted$: Observable<RecoveryAcceptedEvent> =
    this.acceptedSubject.asObservable();

  publishAccepted(event: RecoveryAcceptedEvent): void {
    this.acceptedSubject.next(event);
  }

  onModuleDestroy(): void {
    this.acceptedSubject.complete();
  }
}
