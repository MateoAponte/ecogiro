import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CheckCheck,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import {
  apiAcceptRecovery,
  apiGetAcceptedRecoveries,
  apiGetAvailableRecoveries,
} from '@/lib/recoveries-api';

export default function AgentHomePage({
  mode = 'available',
}: {
  mode?: 'available' | 'accepted';
}) {
  const { user } = useAuth();
  const userId = user?.user_id;
  const [page, setPage] = useState(1);
  const accepting = useRef(false);
  const accepted = mode === 'accepted';
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['agent-recoveries', userId, mode, page],
    queryFn: ({ signal }) =>
      accepted
        ? apiGetAcceptedRecoveries(userId!, page, signal)
        : apiGetAvailableRecoveries(signal),
    enabled: !!userId,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: false,
  });
  const accept = useMutation({
    mutationFn: (id: string) => apiAcceptRecovery(id, userId!),
    onSuccess: () => {
      toast.success('Recuperación aceptada. Ya aparece en Aceptadas.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: async () => {
      accepting.current = false;
      await client.invalidateQueries({ queryKey: ['agent-recoveries', userId] });
    },
    retry: false,
  });

  return (
    <MobileLayout>
      <div className="px-5 py-6 space-y-6">
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-display font-bold">
              {accepted ? 'Aceptadas' : 'Recuperaciones'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {accepted
                ? 'Tus solicitudes aceptadas pendientes de completar.'
                : 'Encuentra una solicitud para recolectar.'}
            </p>
          </div>
          <NotificationCenter />
        </header>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {accepted ? 'Asignadas a ti' : 'Primeras 10 disponibles'}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={query.isFetching || accept.isPending}
            onClick={() => void query.refetch()}
            className="gap-2 rounded-full"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${query.isFetching ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Button>
        </div>

        {query.isPending && (
          <div className="space-y-3" role="status" aria-label="Cargando recuperaciones">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-40 rounded-2xl" />
            ))}
          </div>
        )}

        {query.isError && (
          <section role="alert" className="eco-card space-y-3">
            <p className="text-sm text-destructive">{query.error.message}</p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Reintentar
            </Button>
          </section>
        )}

        {query.isSuccess && query.data.length === 0 && (
          <section className="eco-card text-center py-8 space-y-3">
            {accepted ? (
              <CheckCheck className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            ) : (
              <Truck className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            )}
            <p className="text-sm text-muted-foreground">
              {accepted
                ? 'No hay recuperaciones aceptadas en esta página.'
                : 'No hay recuperaciones disponibles por ahora.'}
            </p>
          </section>
        )}

        <div className="space-y-3">
          {(query.data ?? []).map((recovery) => (
            <article key={recovery.id} className="eco-card space-y-3 animate-fade-up">
              <span
                className={`eco-badge ${accepted ? 'bg-blue-100 text-blue-700' : 'bg-eco-yellow-light text-foreground'}`}
              >
                {accepted ? 'Aceptada' : 'Disponible'}
              </span>
              <div className="flex items-start gap-2 text-sm text-foreground">
                <CalendarClock className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <span className="capitalize">
                  {format(new Date(recovery.scheduled_date), "EEEE d 'de' MMMM · HH:mm", {
                    locale: es,
                  })}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="break-words">{recovery.description}</p>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="break-words">{recovery.address}</p>
              </div>
              {recovery.comments && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="break-words">{recovery.comments}</p>
                </div>
              )}
              {!accepted && (
                <Button
                  className="w-full gap-2"
                  disabled={accept.isPending}
                  onClick={() => {
                    if (!userId || accepting.current) return;
                    accepting.current = true;
                    accept.mutate(recovery.id);
                  }}
                >
                  {accept.isPending && accept.variables === recovery.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                  Aceptar recolección
                </Button>
              )}
            </article>
          ))}
        </div>

        {accepted && (
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              disabled={page === 1 || query.isFetching}
              onClick={() => setPage((value) => value - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Página {page}</span>
            <Button
              variant="outline"
              disabled={
                query.isFetching || query.isError || (query.data?.length ?? 0) < 20
              }
              onClick={() => setPage((value) => value + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
