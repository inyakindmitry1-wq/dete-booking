import React from 'react';
import { Home, LayoutGrid, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ClientTab = 'home' | 'catalog' | 'ticket';

export interface BottomNavProps {
  activeTab: ClientTab;
  onTabChange: (tab: ClientTab) => void;
  hasActiveBooking?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  hasActiveBooking = false,
}) => {
  const tabs = [
    { id: 'home' as ClientTab, label: 'Главная', icon: Home },
    { id: 'catalog' as ClientTab, label: 'Услуги', icon: LayoutGrid },
    { id: 'ticket' as ClientTab, label: 'Моя запись', icon: CalendarDays, badge: hasActiveBooking },
  ];

  const handleTabClick = (tabId: ClientTab) => {
    if (activeTab === tabId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onTabChange(tabId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 max-w-sm mx-auto px-4 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
      {/* Outer ambient soft shadow */}
      <div className="relative pointer-events-auto">
        <div className="absolute -inset-0.5 rounded-full bg-white/[0.04] blur-md pointer-events-none" />

        {/* Floating pill navigation bar - translucent frosted glass matching top hero button */}
        <nav
          aria-label="Основная навигация"
          className="relative rounded-full backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.10] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-1.5 flex items-center justify-between transition-colors duration-300"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "relative flex items-center justify-center min-h-[44px] min-w-[94px] px-3 py-2 rounded-full transition-all duration-200 active:scale-95 select-none text-xs font-semibold",
                  isActive
                    ? "bg-white text-black font-extrabold shadow-[0_0_20px_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.4)] border border-white/40"
                    : "text-zinc-300 hover:text-white hover:bg-white/[0.08]"
                )}
              >
                <div className="relative flex items-center gap-1.5">
                  <Icon className={cn("h-4 w-4 transition-transform", isActive ? "text-black" : "text-zinc-300")} />
                  <span className="tracking-tight">{tab.label}</span>
                  {tab.badge && (
                    <span className={cn(
                      "absolute -top-1 -right-1.5 h-2 w-2 rounded-full animate-pulse",
                      isActive ? "bg-black ring-2 ring-white" : "bg-white ring-2 ring-black"
                    )} />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// Backwards compatibility alias
export const ClientBottomNav = BottomNav;
