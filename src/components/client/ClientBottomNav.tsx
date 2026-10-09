import React from 'react';
import { Sparkles, MessageSquare, Ticket, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ClientTab = 'catalog' | 'ai' | 'ticket' | 'info';

interface ClientBottomNavProps {
  activeTab: ClientTab;
  onTabChange: (tab: ClientTab) => void;
  hasActiveBooking?: boolean;
}

export const ClientBottomNav: React.FC<ClientBottomNavProps> = ({
  activeTab,
  onTabChange,
  hasActiveBooking = false,
}) => {
  const tabs = [
    { id: 'catalog' as ClientTab, label: 'Услуги', icon: Sparkles },
    { id: 'ai' as ClientTab, label: 'AI Чат', icon: MessageSquare },
    { id: 'ticket' as ClientTab, label: 'Мой талон', icon: Ticket, badge: hasActiveBooking },
    { id: 'info' as ClientTab, label: 'О студии', icon: MapPin },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-background/90 backdrop-blur-xl border-t border-white/[0.08] px-3 py-1.5 flex items-center justify-around pb-[calc(env(safe-area-inset-bottom,8px)+6px)] shadow-[0_-4px_25px_rgba(0,0,0,0.5)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 select-none min-w-[64px]",
              isActive
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              {tab.badge && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
