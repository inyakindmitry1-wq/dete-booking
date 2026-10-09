import React, { useState } from 'react';
import { Phone, Share2, Check } from 'lucide-react';
import { DbTenant } from '@/types/database';
import { Button } from '@/components/ui/button';

interface ClientTopBarProps {
  tenant: DbTenant;
}

export const ClientTopBar: React.FC<ClientTopBarProps> = ({ tenant }) => {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: tenant.name,
          text: `${tenant.name} — ${tenant.tagline}`,
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled share
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full max-w-md mx-auto bg-background/80 backdrop-blur-xl border-b border-white/[0.08] px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-secondary">
          <img src={tenant.logo_url} alt={tenant.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-foreground truncate block">
              {tenant.name}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
          </div>
          <span className="text-[10px] text-muted-foreground truncate block leading-tight">
            {tenant.city}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleShare}
          className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground active:scale-95"
          title="Поделиться"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
        </Button>

        <a href={`tel:${tenant.phone.replace(/[^0-9+]/g, '')}`}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground active:scale-95"
            title="Позвонить"
          >
            <Phone className="h-4 w-4 text-primary" />
          </Button>
        </a>
      </div>
    </header>
  );
};
