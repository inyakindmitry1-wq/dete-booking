import React from 'react';
import { Phone, MapPin, Clock, Star, ShieldCheck } from 'lucide-react';
import { DbTenant } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StudioHeroProps {
  tenant: DbTenant;
}

export const StudioHero: React.FC<StudioHeroProps> = ({ tenant }) => {
  const isDetailing = tenant.business_type === 'detailing';

  return (
    <div className="relative overflow-hidden bg-card border-b border-border">
      {/* Background Cover Image with Gradient Overlay */}
      <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-secondary">
        <img
          src={tenant.cover_url}
          alt={tenant.name}
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
      </div>

      {/* Studio Header Content */}
      <div className="relative px-4 pb-5 pt-0 -mt-16 sm:-mt-20">
        <div className="flex items-end justify-between gap-4">
          {/* Logo Avatar */}
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-2 border-border bg-card p-1 shadow-2xl overflow-hidden shrink-0">
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="h-full w-full rounded-xl object-cover"
            />
          </div>

          {/* Quick Contact Buttons */}
          <div className="flex gap-2">
            <a href={`tel:${tenant.phone.replace(/[^0-9+]/g, '')}`}>
              <Button size="sm" variant="outline" className="h-9 px-3 gap-1.5 rounded-xl">
                <Phone className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Позвонить</span>
              </Button>
            </a>
            <a
              href={`https://yandex.ru/maps/?text=${encodeURIComponent(tenant.city + ' ' + tenant.address)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="h-9 px-3 gap-1.5 rounded-xl">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Маршрут</span>
              </Button>
            </a>
          </div>
        </div>

        {/* Studio Info */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {tenant.name}
            </h1>
            <Badge variant="outline" className="text-xs bg-secondary/80 border-border">
              {isDetailing ? 'Детейлинг-студия' : 'Автосервис'}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {tenant.tagline}
          </p>

          {/* Metadata Badges */}
          <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">5.0</span>
              <span>(120+ отзывов)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{tenant.city}, {tenant.address}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Ежедневно c 09:00 до 21:00</span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Гарантия на все работы</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
