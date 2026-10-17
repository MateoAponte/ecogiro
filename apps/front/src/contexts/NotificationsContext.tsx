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
  const userId = user?.user_id;
  const ready = !isRestoringSession && typeof userId === 'number' && userId > 0;
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const sessionRef = useRef<NotificationsSession | null>(null);
  const [snapshot, setSnapshot] = useState(emptyNotifications);

  useEffect(() => {
    if (!ready || userId === undefined) return;
    const session = new NotificationsSession(
      userId,
      setSnapshot,
      () => logoutRef.current(),
      (item) => {
        toast.info(item.title, { description: item.message });
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
