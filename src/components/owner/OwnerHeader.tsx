import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DbTenant } from '@/types/database';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft } from 'lucide-react';

interface OwnerHeaderProps {
  tenant: DbTenant;
  ownerEmail?: string | null;
  onLogout: () => void;
}

export const OwnerHeader: React.FC<OwnerHeaderProps> = ({
  tenant,
  onLogout,
}) => {
  const navigate = useNavigate();
  const studioShortName = tenant.name.split(' ')[0] || tenant.name;

  return (
    <header className="sticky top-0 z-30 bg-[#090b10]/95 backdrop-blur-md border-b border-white/10 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">
            Расписание
          </h1>
          <span className="text-xs text-zinc-400 font-medium block mt-0.5">
            {studioShortName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/s/${tenant.slug}/`)}
            title="Вернуться к онлайн-записи"
            className="h-9 px-3 rounded-xl text-xs gap-1.5 text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>К записи</span>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onLogout}
            title="Выйти"
            aria-label="Выйти"
            className="h-9 w-9 rounded-xl text-zinc-400 hover:text-red-400 bg-white/5 hover:bg-white/10 border border-white/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
