import React from 'react';
import { Calendar, BarChart3, Settings, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OwnerTab = 'schedule' | 'analytics' | 'settings';

interface OwnerBottomNavProps {
  currentTab: OwnerTab;
  onTabChange: (tab: OwnerTab) => void;
  onQuickBlockClick: () => void;
}

export const OwnerBottomNav: React.FC<OwnerBottomNavProps> = ({
  currentTab,
  onTabChange,
  onQuickBlockClick,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border pb-safe">
      <div className="max-w-xl mx-auto flex items-center justify-around px-2 py-1.5">
        {/* Tab 1: Schedule */}
        <button
          type="button"
          onClick={() => onTabChange('schedule')}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95",
            currentTab === 'schedule' ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Calendar className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Расписание</span>
        </button>

        {/* Quick Action: Bay Block */}
        <button
          type="button"
          onClick={onQuickBlockClick}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-amber-400 hover:text-amber-300 active:scale-95 transition-all"
        >
          <div className="h-7 w-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-0.5">
            <Lock className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] font-semibold">Блок поста</span>
        </button>

        {/* Tab 2: Analytics */}
        <button
          type="button"
          onClick={() => onTabChange('analytics')}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95",
            currentTab === 'analytics' ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart3 className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Аналитика</span>
        </button>

        {/* Tab 3: Settings */}
        <button
          type="button"
          onClick={() => onTabChange('settings')}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95",
            currentTab === 'settings' ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Студия</span>
        </button>
      </div>
    </nav>
  );
};
