import { useState } from 'react';
import { Bell, CheckCheck, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNotifications, Notification } from '@/contexts/NotificationsContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

const getNotificationIcon = (type: Notification['type']) =>
  type === 'recovery.completed' ? (
    <CheckCheck className="w-4 h-4 text-primary" />
  ) : (
    <Truck className="w-4 h-4 text-primary" />
  );

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  return `Hace ${diffDays}d`;
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    connection,
    markAsRead,
    refresh,
  } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [readingId, setReadingId] = useState<string | null>(null);

  const handleNotificationClick = async (notification: Notification) => {
    if (readingId) return;
    setReadingId(notification.id);
    try {
      await markAsRead(notification.id);
      setOpen(false);
      if (notification.recoveryId)
        navigate(
          user?.rol === 'RECUPERADOR'
            ? `/agent/recoveries/${notification.recoveryId}`
            : `/collections/${notification.recoveryId}`,
        );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo marcar la notificación como leída.',
      );
    } finally {
      setReadingId(null);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void refresh();
      }}
    >
      <PopoverTrigger asChild>
        <button
          className="relative p-2 hover:bg-muted rounded-xl transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-2" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Notificaciones</h3>
        </div>

        {connection === 'reconnecting' && (
          <p role="status" className="px-4 py-2 text-xs text-muted-foreground">
            Reconectando las notificaciones…
          </p>
        )}
        {error && (
          <div role="alert" className="px-4 py-3 text-sm text-destructive space-y-1">
            <p>{error}</p>
            <button type="button" className="underline" onClick={() => void refresh()}>
              Reintentar
            </button>
          </div>
        )}

        <ScrollArea className="max-h-80">
          {isLoading ? (
            <p
              role="status"
              className="px-4 py-8 text-center text-sm text-muted-foreground"
            >
              Cargando notificaciones…
            </p>
          ) : notifications.length === 0 && !error ? (
            <div className="py-8 text-center">
              <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  disabled={readingId !== null}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
