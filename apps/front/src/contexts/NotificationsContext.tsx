import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { isNative } from '@/lib/platform';
import {
  prepareDeviceNotifications,
  showDeviceNotification,
} from '@/lib/device-notifications';
import type { PluginListenerHandle } from '@capacitor/core';
import type { Notification } from '@/lib/notifications-api';
import { emptyNotifications, NotificationsSession } from '@/lib/notifications-session';

export type { Notification } from '@/lib/notifications-api';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  connection: 'connecting' | 'connected' | 'reconnecting';
  markAsRead: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(
  undefined,
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isRestoringSession, logout } = useAuth();
  const navigate = useNavigate();
  const userRef = useRef(user);
  userRef.current = user;
  const userId = user?.user_id;
  const ready = !isRestoringSession && typeof userId === 'number' && userId > 0;
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const sessionRef = useRef<NotificationsSession | null>(null);
  const [snapshot, setSnapshot] = useState(emptyNotifications);

  useEffect(() => {
    if (!ready || !isNative()) return;
    let disposed = false;
    let listener: PluginListenerHandle | null = null;
    void prepareDeviceNotifications((action) => {
      if (disposed || userRef.current?.user_id !== action.recipientId) return;
      void sessionRef.current
        ?.markAsRead(action.notificationId)
        .then(() => {
          if (
            disposed ||
            userRef.current?.user_id !== action.recipientId ||
            !action.recoveryId
          )
            return;
          navigate(
            userRef.current.rol === 'RECUPERADOR'
              ? `/agent/recoveries/${action.recoveryId}`
              : `/collections/${action.recoveryId}`,
          );
        })
        .catch(() =>
          toast.error('No se pudo abrir la notificación. Intenta desde la campana.'),
        );
    })
      .then((handle) => {
        if (disposed) void handle?.remove();
        else listener = handle;
      })
      .catch(() => {
        if (!disposed)
          toast.error(
            'No se pudieron activar las notificaciones del teléfono. Revisa los permisos.',
          );
      });
    return () => {
      disposed = true;
      void listener?.remove();
    };
  }, [ready, userId, navigate]);

  useEffect(() => {
    if (!ready || userId === undefined) return;
    const session = new NotificationsSession(
      userId,
      setSnapshot,
      () => {
        void logoutRef
          .current()
          .catch(() => toast.error('No se pudo borrar la sesión del dispositivo.'));
      },
      (item) => {
        if (!isNative()) toast.info(item.title, { description: item.message });
        else
          void showDeviceNotification(item)
            .then((shown) => {
              if (!shown && userRef.current?.user_id === item.recipientId)
                toast.info(item.title, { description: item.message });
            })
            .catch(() => {
              if (userRef.current?.user_id === item.recipientId)
                toast.info(item.title, { description: item.message });
            });
      },
    );
    sessionRef.current = session;
    session.start();
    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible') void session.refresh();
    };
    const refreshOnReconnect = () => {
      void session.refresh();
    };
    document.addEventListener('visibilitychange', refreshOnReturn);
    window.addEventListener('online', refreshOnReconnect);
    return () => {
      session.stop();
      if (sessionRef.current === session) sessionRef.current = null;
      document.removeEventListener('visibilitychange', refreshOnReturn);
      window.removeEventListener('online', refreshOnReconnect);
    };
  }, [userId, ready]);

  const markAsRead = useCallback(async (id: string) => {
    await sessionRef.current?.markAsRead(id);
  }, []);
  const refresh = useCallback(async () => {
    await sessionRef.current?.refresh();
  }, []);

  // Never render the previous account's history while an effect is cleaning up.
  const current =
    ready && snapshot.userId === userId
      ? snapshot
      : {
          ...emptyNotifications,
          isLoading: ready,
        };
  return (
    <NotificationsContext.Provider
      value={{
        notifications: current.notifications,
        unreadCount: current.unreadCount,
        isLoading: current.isLoading,
        error: current.error,
        connection: current.connection,
        markAsRead,
        refresh,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context)
    throw new Error('useNotifications must be used within a NotificationsProvider');
  return context;
}
