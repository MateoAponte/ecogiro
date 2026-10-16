import { ReactNode } from "react";
import { TabBar } from "./TabBar";

interface MobileLayoutProps {
  children: ReactNode;
  hideTabBar?: boolean;
}

export function MobileLayout({ children, hideTabBar = false }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      <main className={`flex-1 overflow-y-auto ${hideTabBar ? 'pb-6' : 'pb-24'}`}>
        {children}
      </main>
      {!hideTabBar && <TabBar />}
    </div>
  );
}
