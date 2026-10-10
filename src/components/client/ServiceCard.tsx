import React from 'react';
import { Clock, ArrowUpRight } from 'lucide-react';
import { DbService } from '@/types/database';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDuration } from '@/lib/utils';

export interface ServiceCardProps {
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
      className="group relative flex items-stretch gap-3.5 p-3.5 rounded-2xl border border-white/[0.08] bg-[#12151c]/90 backdrop-blur-xl hover:border-primary/45 hover:bg-[#151923] transition-all duration-300 cursor-pointer active:scale-[0.99] select-none shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
    >
      {/* Subtle top specular border highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Service Image Thumbnail */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl shrink-0 overflow-hidden bg-black border border-white/[0.08] shadow-inner">
        <img
          src={service.image_url}
          alt={service.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white/90 border border-white/10 flex items-center gap-1 shadow">
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
          <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5 leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {service.name}
          </h3>
          <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Bottom Row: Price & Action CTA */}
        <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] text-zinc-400 font-medium">от</span>
            <span className="text-base sm:text-lg font-black text-white tracking-tight">
              {formatCurrency(service.price, currency)}
            </span>
          </div>

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(service);
            }}
            className="h-9 px-3.5 rounded-xl text-xs font-bold shadow-md shadow-primary/20 gap-1.5 active:scale-95 transition-transform"
          >
            <span>Записаться</span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
};
