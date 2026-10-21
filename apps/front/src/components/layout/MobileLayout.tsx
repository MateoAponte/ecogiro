import { ReactNode } from 'react';
import { TabBar } from './TabBar';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  hideTabBar?: boolean;
  className?: string;
}

export function MobileLayout({
  children,
  hideTabBar = false,
  className,
}: MobileLayoutProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-background flex flex-col max-w-md mx-auto',
        className,
      )}
    >
      <main
        className={`flex-1 overflow-y-auto ${hideTabBar ? 'pb-6' : 'eco-tabbar-content'}`}
      >
        {children}
      </main>
      {!hideTabBar && <TabBar />}
    </div>
  );
}
