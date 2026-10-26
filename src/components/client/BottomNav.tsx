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

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 max-w-sm mx-auto px-4 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
      {/* Outer ambient soft shadow */}
      <div className="relative pointer-events-auto">
        <div className="absolute -inset-0.5 rounded-full bg-white/[0.04] blur-sm pointer-events-none" />

        {/* Floating pill navigation bar */}
        <nav
          aria-label="Основная навигация"
          className="relative rounded-full backdrop-blur-2xl bg-[#121316]/95 border border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.9)] p-1.5 flex items-center justify-between"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex items-center justify-center min-h-[44px] min-w-[90px] px-3 py-2 rounded-full transition-all duration-200 active:scale-95 select-none text-xs font-semibold",
                  isActive
                    ? "bg-zinc-800/90 text-white shadow-inner border border-white/10"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <div className="relative flex items-center gap-1.5">
                  <Icon className={cn("h-4 w-4 transition-transform", isActive ? "text-white" : "text-zinc-400")} />
                  <span className="tracking-tight">{tab.label}</span>
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-white ring-2 ring-black animate-pulse" />
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
