import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { DbService } from '@/types/database';
import { Card } from '@/components/ui/card';
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
    <Card className="flex flex-col sm:flex-row overflow-hidden border border-border bg-card/60 backdrop-blur hover:border-primary/50 transition-all duration-200 group">
      {/* Service Image */}
      <div className="relative h-44 sm:h-auto sm:w-48 shrink-0 overflow-hidden bg-secondary">
        <img
          src={service.image_url}
          alt={service.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium text-foreground flex items-center gap-1">
          <Clock className="h-3 w-3 text-primary" />
          <span>{formatDuration(service.duration_minutes)}</span>
        </div>
      </div>

      {/* Service Details */}
      <div className="flex flex-col justify-between p-4 flex-1">
        <div>
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
            {service.category}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5 leading-snug">
            {service.name}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Footer: Price + Action */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] text-muted-foreground block">Стоимость от</span>
            <span className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
              {formatCurrency(service.price, currency)}
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => onSelect(service)}
            className="rounded-xl px-4 font-semibold shadow-sm gap-1.5"
          >
            <span>Записаться</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
