import React from 'react';
import { DbTenant } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Sparkles, RefreshCw, CheckCircle2, Info } from 'lucide-react';

interface SettingsViewProps {
  tenant: DbTenant;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ tenant }) => {
  return (
    <div className="space-y-4">
      {/* Studio Profile Card */}
      <Card className="p-4 border border-border bg-card space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden border border-border shrink-0">
            <img src={tenant.logo_url} alt={tenant.name} className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{tenant.name}</h2>
            <span className="text-xs text-muted-foreground block">
              Идентификатор студии: <code className="text-primary font-mono">{tenant.slug}</code>
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 text-xs space-y-1.5 text-muted-foreground">
          <div className="flex justify-between">
            <span>Адрес:</span>
            <span className="text-foreground font-medium">{tenant.address}</span>
          </div>
          <div className="flex justify-between">
            <span>Телефон:</span>
            <span className="text-foreground font-medium">{tenant.phone}</span>
          </div>
          <div className="flex justify-between">
            <span>Часовой пояс:</span>
            <span className="text-foreground font-medium">{tenant.timezone}</span>
          </div>
          <div className="flex justify-between">
            <span>Цвет акцента:</span>
            <span className="text-foreground font-mono font-bold flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tenant.accent_color }} />
              {tenant.accent_color}
            </span>
          </div>
        </div>
      </Card>

      {/* Deployment & Mode */}
      <Card className="p-4 border border-border bg-card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Режим публикации
          </span>
          <Badge variant={tenant.is_preview ? 'warning' : 'success'} className="text-xs">
            {tenant.is_preview ? 'Preview (Демо)' : 'Live (Боевой)'}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {tenant.is_preview
            ? 'Студия работает в режиме предпросмотра. Реальные SMS и Push-уведомления не отправляются.'
            : 'Боевой режим активен. Все записи и уведомления обрабатываются в штатном режиме.'}
        </p>

        <div className="p-3 rounded-xl bg-secondary/50 border border-border text-xs flex items-start gap-2 text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <span>
            Чтобы обновить услуги, цены или график, отредактируйте <code className="text-primary">tenants/{tenant.slug}/business.json</code> и выполните <code className="text-primary">npm run tenant:publish</code>. Все существующие записи будут полностью сохранены!
          </span>
        </div>
      </Card>
    </div>
  );
};
