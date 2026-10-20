import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { z } from 'zod';
import type { Notification } from './notifications-api';
import { getAuthUser } from './auth-session';

const CHANNEL_ID = 'ecogiro-recoveries';
const actionSchema = z.object({
  notificationId: z.string().uuid(),
  recipientId: z.number().int().positive(),
  recoveryId: z.string().uuid().nullable(),
});
export type DeviceNotificationAction = z.infer<typeof actionSchema>;
let operations: Promise<unknown> = Promise.resolve();

export async function prepareDeviceNotifications(
  onAction: (action: DeviceNotificationAction) => void,
): Promise<PluginListenerHandle | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const listener = await LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (event) => {
      const data = actionSchema.safeParse(event.notification.extra);
      if (data.success) onAction(data.data);
    },
  );
  try {
    if (Capacitor.getPlatform() === 'android')
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Recolecciones',
        description: 'Estado de tus recolecciones',
        importance: 4,
        visibility: 0,
        vibration: true,
      });
    let permission = await LocalNotifications.checkPermissions();
    if (
      permission.display === 'prompt' ||
      permission.display === 'prompt-with-rationale'
    ) {
      permission = await LocalNotifications.requestPermissions();
    }
    // Denial does not block the notification history or the rest of the app.
    return listener;
  } catch (error) {
    await listener.remove();
    throw error;
  }
}

export function showDeviceNotification(item: Notification): Promise<boolean> {
  const next = operations.then(async () => {
    if (!Capacitor.isNativePlatform() || getAuthUser()?.user_id !== item.recipientId)
      return false;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    if ((await LocalNotifications.checkPermissions()).display !== 'granted') return false;
    if (getAuthUser()?.user_id !== item.recipientId) return false;
    const id = parseInt(item.id.replace(/-/g, '').slice(0, 8), 16) & 0x7fffffff;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: id || 1,
          title: item.title,
          body: item.message,
          channelId: CHANNEL_ID,
          extra: {
            notificationId: item.id,
            recipientId: item.recipientId,
            recoveryId: item.recoveryId,
          },
        },
      ],
    });
    return true;
  });
  operations = next.catch(() => undefined);
  return next;
}

export function clearDeviceNotifications(): Promise<void> {
  const next = operations.then(async () => {
    if (!Capacitor.isNativePlatform()) return;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length)
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(({ id }) => ({ id })),
      });
    await LocalNotifications.removeAllDeliveredNotifications();
  });
  operations = next.catch(() => undefined);
  return next;
}
