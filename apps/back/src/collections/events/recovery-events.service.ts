import { RecoveryCanceledEvent } from './recovery-canceled.event';
import { RecoveryCompletedEvent } from './recovery-completed.event';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { RecoveryAcceptedEvent } from './recovery-accepted.event';
import { RecoveryRejectedEvent } from './recovery-rejected.event';

@Injectable()
export class RecoveryEventsService implements OnModuleDestroy {
  private readonly completedSubject = new Subject<RecoveryCompletedEvent>();
  readonly completed$ = this.completedSubject.asObservable();
  publishCompleted(event: RecoveryCompletedEvent): void {
    this.completedSubject.next(event);
  }
  private readonly canceledSubject = new Subject<RecoveryCanceledEvent>();
  private readonly acceptedSubject = new Subject<RecoveryAcceptedEvent>();
  private readonly rejectedSubject = new Subject<RecoveryRejectedEvent>();
  // Consumers can subscribe, but only this service can publish into the Subject.
  readonly accepted$: Observable<RecoveryAcceptedEvent> =
    this.acceptedSubject.asObservable();
  publishAccepted(event: RecoveryAcceptedEvent): void {
    this.acceptedSubject.next(event);
  }

  readonly canceled$ = this.canceledSubject.asObservable();
  publishCanceled(event: RecoveryCanceledEvent): void {
    this.canceledSubject.next(event);
  }

  readonly rejected$: Observable<RecoveryRejectedEvent> =
    this.rejectedSubject.asObservable();
  publishRejected(event: RecoveryRejectedEvent): void {
    this.rejectedSubject.next(event);
  }

  onModuleDestroy(): void {
    this.completedSubject.complete();
    this.canceledSubject.complete();
    this.acceptedSubject.complete();
    this.rejectedSubject.complete();
  }
}
