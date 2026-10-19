import { Home, ClipboardList, Gift, User, CheckCheck, Truck } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const tabs = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: ClipboardList, label: 'Recolecciones', path: '/collections' },
  { icon: Gift, label: 'Premios', path: '/rewards' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

export function TabBar() {
  const { user } = useAuth();
  const visibleTabs =
    user?.rol === 'RECUPERADOR'
      ? [
          { icon: CheckCheck, label: 'Aceptadas', path: '/agent/accepted' },
          { icon: Truck, label: 'Recuperaciones', path: '/agent/recoveries' },
          { icon: User, label: 'Usuario', path: '/agent/profile' },
        ]
      : tabs;
  return (
    <nav className="eco-tabbar fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elevated z-50">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-4">
        {visibleTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 min-w-[64px]',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon
                  className={cn(
                    'w-6 h-6 transition-transform duration-200',
                    isActive && 'scale-110',
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-xs font-medium">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
