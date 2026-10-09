import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DbTenant } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Calendar, Clock, ChevronRight, Sparkles } from 'lucide-react';

interface StoredBooking {
  booking_id: string;
  access_token: string;
  service_name: string;
  start_time: string;
}

interface MyBookingsViewProps {
  tenant: DbTenant;
  onBookNew: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({ tenant, onBookNew }) => {
  const [bookings, setBookings] = useState<StoredBooking[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`recent_bookings_${tenant.slug}`);
      if (raw) {
        setBookings(JSON.parse(raw));
      }
    } catch {
      // ignore parse errors
    }
  }, [tenant.slug]);

  if (bookings.length === 0) {
    return (
      <div className="py-12 px-4 text-center space-y-4 animate-in fade-in duration-200">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-secondary/80 border border-white/10 text-muted-foreground">
          <Ticket className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            Нет активных талонов
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Здесь будут отображаться ваши электронные талоны на обслуживание в студии.
          </p>
        </div>
        <Button onClick={onBookNew} className="h-11 px-5 rounded-xl font-bold gap-2 active:scale-95">
          <Sparkles className="h-4 w-4" />
          <span>Выбрать услугу</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
          Ваши сохраненные записи ({bookings.length})
        </h3>
      </div>

      <div className="space-y-2.5">
        {bookings.map((b) => (
          <a
            key={b.booking_id}
            href={`/s/${tenant.slug}/booking/${b.booking_id}?token=${b.access_token}`}
            className="block p-4 rounded-2xl border border-white/[0.08] bg-card/70 backdrop-blur-md hover:border-primary/40 transition-all active:scale-[0.99] group shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 mb-1">
                  Талон #{b.booking_id.slice(0, 8)}
                </Badge>
                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {b.service_name}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" />
                    <span>{format(new Date(b.start_time), 'd MMM (EEEE)', { locale: ru })}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" />
                    <span>{format(new Date(b.start_time), 'HH:mm')}</span>
                  </span>
                </div>
              </div>

              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
