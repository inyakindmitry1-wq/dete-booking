import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DbTenant } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft, Shield } from 'lucide-react';

interface OwnerHeaderProps {
  tenant: DbTenant;
  ownerEmail: string | null;
  onLogout: () => void;
}

export const OwnerHeader: React.FC<OwnerHeaderProps> = ({
  tenant,
  ownerEmail,
  onLogout,
}) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border px-4 py-3">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-foreground leading-none">
                {tenant.name}
              </h1>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                Кабинет
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block truncate max-w-[180px]">
              {ownerEmail || 'Владелец'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/s/${tenant.slug}/`)}
            title="Вернуться к онлайн-записи"
            className="h-8 px-2.5 rounded-xl text-xs gap-1.5 text-zinc-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">К записи</span>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onLogout}
            title="Выйти"
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
