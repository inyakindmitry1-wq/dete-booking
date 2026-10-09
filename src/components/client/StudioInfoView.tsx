import React from 'react';
import { DbTenant } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Sparkles,
  Navigation,
  Lock,
  ExternalLink,
} from 'lucide-react';

interface StudioInfoViewProps {
  tenant: DbTenant;
}

export const StudioInfoView: React.FC<StudioInfoViewProps> = ({ tenant }) => {
  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-200">
      <div className="p-4 rounded-2xl border border-white/[0.08] bg-card/60 backdrop-blur-md space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
          Контакты и локация
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground block">{tenant.city}</span>
              <span>{tenant.address}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span>Ежедневно с 09:00 до 21:00</span>
          </div>

          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Phone className="h-4 w-4 text-primary shrink-0" />
            <a href={`tel:${tenant.phone.replace(/[^0-9+]/g, '')}`} className="text-foreground font-semibold hover:underline">
              {tenant.phone}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <a
            href={`https://yandex.ru/maps/?text=${encodeURIComponent(tenant.city + ' ' + tenant.address)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" className="w-full h-10 rounded-xl text-xs font-semibold gap-1.5 border border-white/10 active:scale-95">
              <Navigation className="h-3.5 w-3.5 text-primary" />
              <span>Яндекс Карты</span>
            </Button>
          </a>

          <a
            href={`https://2gis.ru/search/${encodeURIComponent(tenant.city + ' ' + tenant.address)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" className="w-full h-10 rounded-xl text-xs font-semibold gap-1.5 border border-white/10 active:scale-95">
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
              <span>2ГИС</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Standards & Guarantees */}
      <div className="p-4 rounded-2xl border border-white/[0.08] bg-card/60 backdrop-blur-md space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
          Наши стандарты
        </h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3 text-xs">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-foreground block">Гарантия на все работы</span>
              <span className="text-muted-foreground">
                Предоставляем официальную гарантию и акт осмотра автомобиля.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-foreground block">Премиальные материалы</span>
              <span className="text-muted-foreground">
                Используем только сертифицированную автохимию и инструменты ведущих мировых брендов.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Link to Owner Area */}
      <div className="pt-2">
        <Button
          variant="ghost"
          onClick={() => (window.location.href = `/s/${tenant.slug}/owner/`)}
          className="w-full h-11 rounded-xl text-xs text-muted-foreground hover:text-foreground gap-2 border border-white/[0.06]"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Вход для персонала и владельца студии</span>
        </Button>
      </div>
    </div>
  );
};
