import { Injectable } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import {
  concat,
  defer,
  finalize,
  interval,
  map,
  merge,
  Observable,
  of,
  Subject,
} from 'rxjs';
import type { NotificationResponseDto } from '../dto/notification-response.dto';

@Injectable()
export class NotificationsStreamService {
  // One user can have several active connections (for example, multiple tabs).
  private readonly channels = new Map<number, Set<Subject<MessageEvent>>>();

  // Emite un mensaje cuando se crea una nueva conexión o cuando se cierra una.
  connect(recipientId?: number): Observable<MessageEvent> {
    // Temporary compatibility: the controller still calls connect() without an ID.
    // Such connections receive only connection.ready and heartbeat.
    if (recipientId === undefined) return this.connectionEvents();

    return defer(() => {
      const channel = new Subject<MessageEvent>();
      const connections =
        this.channels.get(recipientId) ?? new Set<Subject<MessageEvent>>();
      connections.add(channel);
      this.channels.set(recipientId, connections);

      // Subscribe to live notifications before emitting connection.ready.
      return merge(channel, this.connectionEvents()).pipe(
        finalize(() => {
          connections.delete(channel);
          if (connections.size === 0) this.channels.delete(recipientId);
          channel.complete();
        }),
      );
    });
  }

  // Es quien publica las notificaciones. No se guarda en la base de datos.
  publish(notification: NotificationResponseDto): void {
    const connections = this.channels.get(notification.recipient_id);
    if (!connections) return; // Offline users will read the persisted history later.

    for (const channel of connections) {
      channel.next({ type: 'notification.created', data: notification });
    }
  }

  private connectionEvents(): Observable<MessageEvent> {
    // Each connection creates its own sequence when Nest subscribes to it.
    return defer(() =>
      concat(
        of({
          type: 'connection.ready',
          data: {
            content: 'Connection ready',
            timestamp: new Date().toISOString(),
          },
        }),
        // Interval genera señales periodicas, Pipe ejecuta el trabajo
        interval(25_000).pipe(
          // Combinarlo con operadores para transformar datos, filtrar señales, ejecutar tareas o deterner secuencias
          map(() => ({
            // Cada señal se convierte en un mensaje de tipo heartbeat
            type: 'heartbeat',
            data: { timestamp: new Date().toISOString() },
          })),
        ),
      ),
    );
  }
}
