import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { DbService } from '@/types/database';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDuration } from '@/lib/utils';

interface ServiceCardProps {
  service: DbService;
  currency: string;
  onSelect: (service: DbService) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  currency,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(service)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(service);
        }
      }}
      className="group relative flex items-stretch gap-3.5 p-3 rounded-2xl border border-white/[0.08] bg-card/70 backdrop-blur-md hover:border-primary/40 hover:bg-card/90 transition-all duration-200 cursor-pointer active:scale-[0.99] select-none shadow-sm hover:shadow-md"
    >
      {/* Service Image Thumbnail */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl shrink-0 overflow-hidden bg-secondary/80 border border-white/[0.08]">
        <img
          src={service.image_url}
          alt={service.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-white/90 flex items-center gap-1 shadow">
          <Clock className="h-2.5 w-2.5 text-primary" />
          <span>{formatDuration(service.duration_minutes)}</span>
        </div>
      </div>

      {/* Service Details */}
      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
            {service.category}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-foreground mt-0.5 leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {service.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Bottom Row: Price & Action */}
        <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] text-muted-foreground">от</span>
            <span className="text-base sm:text-lg font-black text-foreground tracking-tight">
              {formatCurrency(service.price, currency)}
            </span>
          </div>

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(service);
            }}
            className="h-8 px-3 rounded-lg text-xs font-bold shadow-sm gap-1 active:scale-95"
          >
            <span>Записаться</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
