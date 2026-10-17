import { LogOut, Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export default function AgentHomePage() {
  const { user, logout } = useAuth();
  return (
    <MobileLayout hideTabBar>
      <div className="px-5 py-6 space-y-6">
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-display font-bold">Panel de recuperador</h1>
            <p className="text-muted-foreground">Hola, {user?.nombres}.</p>
          </div>
          <NotificationCenter />
        </header>
        <section className="eco-card space-y-3">
          <Truck className="h-8 w-8 text-primary" />
          <h2 className="font-display font-semibold">Tus recolecciones</h2>
          <p className="text-sm text-muted-foreground">
            La gestión de solicitudes estará disponible próximamente.
          </p>
        </section>
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full gap-2 text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </MobileLayout>
  );
}
