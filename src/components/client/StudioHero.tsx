import React from 'react';
import { Phone, MapPin, Star, ShieldCheck, Sparkles, Navigation } from 'lucide-react';
import { DbTenant } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StudioHeroProps {
  tenant: DbTenant;
}

export const StudioHero: React.FC<StudioHeroProps> = ({ tenant }) => {
  const isDetailing = tenant.business_type === 'detailing';

  return (
    <div className="relative w-full overflow-hidden bg-background">
      {/* Cover Banner with smooth dark vignette */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-secondary">
        <img
          src={tenant.cover_url}
          alt={tenant.name}
          className="h-full w-full object-cover opacity-70 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/30" />
      </div>

      {/* Main Studio Profile Card */}
      <div className="relative px-4 pb-4 -mt-14 sm:-mt-16">
        <div className="flex items-end justify-between gap-3">
          {/* Studio Avatar */}
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-background/90 bg-card p-1 shadow-2xl overflow-hidden shrink-0 ring-1 ring-white/10">
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="h-full w-full rounded-xl object-cover"
            />
          </div>

          {/* Quick Action Chips */}
          <div className="flex items-center gap-2 mb-1">
            <a href={`tel:${tenant.phone.replace(/[^0-9+]/g, '')}`} className="shrink-0">
              <Button size="sm" variant="secondary" className="h-9 px-3 gap-1.5 rounded-xl border border-white/10 active:scale-95 text-xs font-semibold">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span>Звонок</span>
              </Button>
            </a>
            <a
              href={`https://yandex.ru/maps/?text=${encodeURIComponent(tenant.city + ' ' + tenant.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button size="sm" variant="secondary" className="h-9 px-3 gap-1.5 rounded-xl border border-white/10 active:scale-95 text-xs font-semibold">
                <Navigation className="h-3.5 w-3.5 text-primary" />
                <span>Карта</span>
              </Button>
            </a>
          </div>
        </div>

        {/* Title, Badge, and Tagline */}
        <div className="mt-2.5 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {tenant.name}
            </h1>
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
              {isDetailing ? 'Детейлинг' : 'Автосервис'}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {tenant.tagline}
          </p>

          {/* Info Chips Row */}
          <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1 bg-secondary/60 px-2 py-0.5 rounded-md border border-white/[0.06]">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-bold text-foreground">5.0</span>
              <span className="text-muted-foreground">(120+)</span>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Открыто до 21:00</span>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground truncate max-w-[200px]">
              <MapPin className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate">{tenant.address}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
