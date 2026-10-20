import {
  apiGetNotifications,
  apiGetUnreadCount,
  apiReadNotification,
  consumeNotificationsStream,
  NotificationsAuthError,
  type Notification,
} from './notifications-api';

export interface NotificationsSnapshot {
  userId: number | null;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  connection: 'connecting' | 'connected' | 'reconnecting';
}

export const emptyNotifications: NotificationsSnapshot = {
  userId: null,
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  connection: 'connecting',
};

function ordered(items: Notification[]): Notification[] {
  return items
    .sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id),
    )
    .slice(0, 50);
}

// One instance per authenticated browser tab. It owns requests, reconnection and
// reconciliation so React renders cannot open duplicate streams or mix users.
export class NotificationsSession {
  private readonly controller = new AbortController();
  private snapshot: NotificationsSnapshot;
  private revision = 0;
  private refreshing: Promise<void> | null = null;
  private refreshAgain = false;
  private readonly knownIds = new Set<string>();
  private readonly reading = new Map<string, Promise<void>>();
  private started = false;

  constructor(
    private readonly userId: number,
    private readonly onChange: (snapshot: NotificationsSnapshot) => void,
    private readonly onAuthExpired: () => void,
    private readonly onNewNotification: (item: Notification) => void,
  ) {
    this.snapshot = { ...emptyNotifications, userId, isLoading: true };
  }

  start(): void {
    if (this.started || this.controller.signal.aborted) return;
    this.started = true;
    this.emit({});
    void this.connectLoop();
  }

  stop(): void {
    this.controller.abort();
  }

  private emit(changes: Partial<NotificationsSnapshot>): void {
    if (this.controller.signal.aborted) return;
    this.snapshot = { ...this.snapshot, ...changes };
    this.onChange(this.snapshot);
  }

  refresh(): Promise<void> {
    if (this.controller.signal.aborted) return Promise.resolve();
    if (this.refreshing) {
      this.refreshAgain = true;
      return this.refreshing;
    }
    this.refreshing = this.loadSnapshot().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  private async loadSnapshot(): Promise<void> {
    do {
      this.refreshAgain = false;
      const revision = this.revision;
      try {
        const [notifications, unreadCount] = await Promise.all([
          apiGetNotifications(this.userId, this.controller.signal),
          apiGetUnreadCount(this.userId, this.controller.signal),
        ]);
        if (this.controller.signal.aborted) return;
        // A live event/read arrived while the snapshot was loading. Fetch again
        // rather than replacing it with a stale list or stale unread count.
        if (revision !== this.revision) {
          this.refreshAgain = true;
          continue;
        }
        notifications.forEach((item) => this.knownIds.add(item.id));
        this.emit({
          notifications: ordered(notifications),
          unreadCount,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (this.controller.signal.aborted) return;
        if (error instanceof NotificationsAuthError) {
          this.stop();
          this.onAuthExpired();
          return;
        }
        this.emit({
          isLoading: false,
          error: 'No se pudieron cargar tus notificaciones. Intenta nuevamente.',
        });
        return;
      }
    } while (this.refreshAgain && !this.controller.signal.aborted);
  }

  private receive(item: Notification): void {
    if (this.controller.signal.aborted || item.recipientId !== this.userId) return;
    const isNew = !this.knownIds.has(item.id);
    this.knownIds.add(item.id);
    const existing = this.snapshot.notifications.find((value) => value.id === item.id);
    const merged = { ...item, read: item.read || existing?.read === true };
    this.revision++;
    this.emit({
      notifications: ordered([
        merged,
        ...this.snapshot.notifications.filter((value) => value.id !== item.id),
      ]),
      unreadCount: this.snapshot.unreadCount + (isNew && !merged.read ? 1 : 0),
    });
    if (isNew) this.onNewNotification(merged);
    // Reconcile with the authoritative count (which includes notifications
    // outside the latest 50 and read changes from other devices).
    void this.refresh();
  }

  markAsRead(id: string): Promise<void> {
    const pending = this.reading.get(id);
    if (pending) return pending;
    const operation = this.read(id).finally(() => this.reading.delete(id));
    this.reading.set(id, operation);
    return operation;
  }

  private async read(id: string): Promise<void> {
    if (
      this.controller.signal.aborted ||
      this.snapshot.notifications.find((item) => item.id === id)?.read
    )
      return;
    try {
      const updated = await apiReadNotification(id, this.userId, this.controller.signal);
      if (this.controller.signal.aborted) return;
      const wasUnread = this.snapshot.notifications.some(
        (item) => item.id === id && !item.read,
      );
      this.revision++;
      this.emit({
        notifications: this.snapshot.notifications.map((item) =>
          item.id === id ? updated : item,
        ),
        unreadCount: Math.max(0, this.snapshot.unreadCount - (wasUnread ? 1 : 0)),
      });
      void this.refresh();
    } catch (error) {
      if (this.controller.signal.aborted) return;
      if (error instanceof NotificationsAuthError) {
        this.stop();
        this.onAuthExpired();
      }
      throw error;
    }
  }

  private async connectLoop(): Promise<void> {
    let delay = 1000;
    while (!this.controller.signal.aborted) {
      try {
        await consumeNotificationsStream(
          this.userId,
          this.controller.signal,
          () => {
            delay = 1000;
            this.emit({ connection: 'connected' });
            // Open the stream before the snapshot to avoid a startup delivery gap.
            void this.refresh();
          },
          (item) => this.receive(item),
        );
      } catch (error) {
        if (this.controller.signal.aborted) return;
        if (error instanceof NotificationsAuthError) {
          this.stop();
          this.onAuthExpired();
          return;
        }
      }
      if (this.controller.signal.aborted) return;
      this.emit({ connection: 'reconnecting' });
      // The persisted history remains usable even if SSE is temporarily down.
      if (this.snapshot.isLoading) void this.refresh();
      await this.wait(delay);
      delay = Math.min(delay * 2, 30_000);
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const signal = this.controller.signal;
      if (signal.aborted) {
        resolve();
        return;
      }
      const done = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', done);
        resolve();
      };
      const timer = setTimeout(done, ms);
      signal.addEventListener('abort', done, { once: true });
    });
  }
}
