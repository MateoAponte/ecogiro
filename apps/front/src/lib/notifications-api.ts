import { z } from 'zod';
import { API_BASE_URL, apiRestoreSession } from './api';
import { getAuthTokens } from './auth-session';

const notificationSchema = z.object({
  id: z.string().uuid(),
  recipient_id: z.number().int().positive(),
  recovery_id: z.string().uuid().nullable(),
  type: z.enum([
    'recovery.accepted',
    'recovery.rejected',
    'recovery.completed',
    'recovery.canceled',
  ]),
  title: z.string(),
  message: z.string(),
  created_at: z.string().datetime({ offset: true }),
  read_at: z.string().datetime({ offset: true }).nullable(),
});

export interface Notification {
  id: string;
  recipientId: number;
  recoveryId: string | null;
  type: z.infer<typeof notificationSchema>['type'];
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export class NotificationsAuthError extends Error {
  constructor() {
    super('Tu sesión expiró. Inicia sesión nuevamente.');
  }
}

export function parseNotification(value: unknown, userId: number): Notification {
  const parsed = notificationSchema.safeParse(value);
  if (!parsed.success || parsed.data.recipient_id !== userId)
    throw new Error('El servidor devolvió una notificación inválida.');
  const item = parsed.data;
  return {
    id: item.id,
    recipientId: item.recipient_id,
    recoveryId: item.recovery_id,
    type: item.type,
    title: item.title,
    message: item.message,
    createdAt: item.created_at,
    read: item.read_at !== null,
  };
}

async function authorizedFetch(
  path: string,
  userId: number,
  signal: AbortSignal,
  method = 'GET',
  stream = false,
): Promise<Response> {
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new NotificationsAuthError();
  for (let attempt = 0; attempt < 2; attempt++) {
    signal.throwIfAborted();
    const tokens = getAuthTokens();
    if (!tokens) throw new NotificationsAuthError();
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, '')}/notifications${path}`,
      {
        method,
        signal: stream ? signal : AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          Accept: stream ? 'text/event-stream' : 'application/json',
        },
      },
    );
    if (response.status === 401 && attempt === 0) {
      await response.body?.cancel();
      signal.throwIfAborted();
      // Another concurrent notification request may already have renewed it.
      if (getAuthTokens()?.accessToken !== tokens.accessToken) continue;
      const restored = await apiRestoreSession();
      signal.throwIfAborted();
      if (!restored.success || restored.data?.user_id !== userId)
        throw new NotificationsAuthError();
      continue;
    }
    if (response.status === 401) throw new NotificationsAuthError();
    if (!response.ok) {
      const payload = z
        .object({ message: z.union([z.string(), z.array(z.string())]) })
        .safeParse(await response.json().catch(() => null));
      const message = payload.success ? payload.data.message : null;
      throw new Error(
        (Array.isArray(message) ? message.join(' ') : message) ||
          'No se pudieron cargar las notificaciones.',
      );
    }
    return response;
  }
  throw new NotificationsAuthError();
}

export async function apiGetNotifications(
  userId: number,
  signal: AbortSignal,
): Promise<Notification[]> {
  const response = await authorizedFetch('', userId, signal);
  const body = z.object({ data: z.array(z.unknown()) }).parse(await response.json());
  return body.data.map((item) => parseNotification(item, userId));
}

export async function apiGetUnreadCount(
  userId: number,
  signal: AbortSignal,
): Promise<number> {
  const response = await authorizedFetch('/unread-count', userId, signal);
  return z.object({ data: z.number().int().nonnegative() }).parse(await response.json())
    .data;
}

export async function apiReadNotification(
  id: string,
  userId: number,
  signal: AbortSignal,
): Promise<Notification> {
  if (!z.string().uuid().safeParse(id).success)
    throw new Error('El ID de la notificación no es válido.');
  const response = await authorizedFetch(`/${id}/read`, userId, signal, 'PATCH');
  const body = z.object({ data: z.unknown() }).parse(await response.json());
  const item = parseNotification(body.data, userId);
  if (item.id !== id || !item.read)
    throw new Error('El servidor no confirmó la lectura de la notificación.');
  return item;
}

// SSE frames may be split across any UTF-8 chunk or use CRLF, LF or CR lines.
export function createSseParser(onEvent: (type: string, data: string) => void) {
  let buffer = '',
    type = '',
    data: string[] = [];
  return (chunk: string) => {
    buffer += chunk;
    if (buffer.length > 256_000)
      throw new Error('El evento de notificación es demasiado grande.');
    let position: number;
    while ((position = buffer.search(/[\r\n]/)) !== -1) {
      if (buffer[position] === '\r' && position === buffer.length - 1) break;
      const line = buffer.slice(0, position);
      buffer = buffer.slice(
        position + (buffer[position] === '\r' && buffer[position + 1] === '\n' ? 2 : 1),
      );
      if (!line) {
        if (data.length) onEvent(type || 'message', data.join('\n'));
        type = '';
        data = [];
      } else if (!line.startsWith(':')) {
        const colon = line.indexOf(':');
        const field = colon === -1 ? line : line.slice(0, colon);
        const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');
        if (field === 'event') type = value;
        if (field === 'data') data.push(value);
        if (data.join('\n').length > 256_000)
          throw new Error('El evento de notificación es demasiado grande.');
      }
    }
  };
}

export async function consumeNotificationsStream(
  userId: number,
  signal: AbortSignal,
  onReady: () => void,
  onNotification: (item: Notification) => void,
): Promise<void> {
  const idle = new AbortController();
  const connectionSignal = AbortSignal.any([signal, idle.signal]);
  let timer = setTimeout(() => idle.abort(), 45_000);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const response = await authorizedFetch(
      '/stream',
      userId,
      connectionSignal,
      'GET',
      true,
    );
    if (
      !response.headers.get('content-type')?.includes('text/event-stream') ||
      !response.body
    ) {
      await response.body?.cancel();
      throw new Error('El servidor no abrió el canal de notificaciones.');
    }
    reader = response.body.getReader();
    const decoder = new TextDecoder();
    const parse = createSseParser((type, data) => {
      if (type === 'connection.ready') onReady();
      if (type === 'notification.created')
        onNotification(parseNotification(JSON.parse(data), userId));
      if (type === 'error') throw new Error('El canal de notificaciones se interrumpió.');
      // Heartbeats and transport IDs are not persisted notifications or replay cursors.
    });
    while (!connectionSignal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      clearTimeout(timer);
      timer = setTimeout(() => idle.abort(), 45_000);
      parse(decoder.decode(value, { stream: true }));
    }
  } finally {
    clearTimeout(timer);
    if (reader) {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  }
}
