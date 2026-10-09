import React from 'react';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DbResource, DbBooking, DbResourceOccupancy, DbTenant } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { Calendar, Clock, Car, User, Phone, Lock, ChevronRight } from 'lucide-react';

interface ScheduleViewProps {
  tenant: DbTenant;
  selectedDate: string;
  onDateChange: (date: string) => void;
  resources: DbResource[];
  bookings: DbBooking[];
  occupancies: DbResourceOccupancy[];
  onSelectBooking: (booking: DbBooking) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  tenant,
  selectedDate,
  onDateChange,
  resources,
  bookings,
  occupancies,
  onSelectBooking,
}) => {
  // 5 days selector strip
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayLabel = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : format(d, 'EEEEEE', { locale: ru });
    const dayDate = format(d, 'd MMM', { locale: ru });
    return { dateStr, dayLabel, dayDate };
  });

  return (
    <div className="space-y-4">
      {/* Date selector strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {days.map((d) => {
          const isSelected = d.dateStr === selectedDate;
          return (
            <button
              key={d.dateStr}
              type="button"
              onClick={() => onDateChange(d.dateStr)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[70px] py-2 px-2 rounded-xl border text-center transition-all shrink-0 active:scale-95",
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                  : "border-border bg-secondary/50 text-muted-foreground hover:border-border/80 hover:text-foreground"
              )}
            >
              <span className="text-[10px] uppercase capitalize">{d.dayLabel}</span>
              <span className="text-xs font-semibold mt-0.5 text-foreground">{d.dayDate}</span>
            </button>
          );
        })}
      </div>

      {/* Summary line */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Постов в работе: {resources.length}</span>
        <span>Всего записей на день: {bookings.length}</span>
      </div>

      {/* Bay Lanes */}
      <div className="space-y-4">
        {resources.map((res) => {
          const bayBookings = bookings.filter((b) => b.resource_id === res.id);
          const bayBlocks = occupancies.filter(
            (o) =>
              o.resource_id === res.id &&
              o.occupancy_type === 'manual_block' &&
              o.start_time.startsWith(selectedDate)
          );

          return (
            <div key={res.id} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {res.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {bayBookings.length + bayBlocks.length} событий
                </span>
              </div>

              {bayBookings.length === 0 && bayBlocks.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border bg-secondary/20 text-center text-xs text-muted-foreground">
                  Пост свободен на выбранную дату
                </div>
              ) : (
                <div className="grid gap-2">
                  {/* Manual Blocks */}
                  {bayBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-amber-400" />
                        <div>
                          <span className="font-bold text-amber-300 block">
                            Блокировка поста: {block.note || 'Технический перерыв'}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(block.start_time), 'HH:mm')} — {format(new Date(block.end_time), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                      <Badge variant="warning" className="text-[10px]">
                        Заблокирован
                      </Badge>
                    </div>
                  ))}

                  {/* Customer Bookings */}
                  {bayBookings.map((b) => {
                    const statusVariant =
                      b.status === 'confirmed'
                        ? 'default'
                        : b.status === 'checked_in'
                        ? 'warning'
                        : b.status === 'completed'
                        ? 'success'
                        : 'destructive';

                    const statusLabel =
                      b.status === 'confirmed'
                        ? 'Ожидает'
                        : b.status === 'checked_in'
                        ? 'В работе'
                        : b.status === 'completed'
                        ? 'Выполнен'
                        : 'Отменен';

                    return (
                      <Card
                        key={b.id}
                        onClick={() => onSelectBooking(b)}
                        className="p-3.5 border border-border bg-card hover:border-primary/50 cursor-pointer transition-all active:scale-[0.99] space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-foreground flex items-center gap-1 font-mono">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              {format(new Date(b.start_time), 'HH:mm')} — {format(new Date(b.end_time), 'HH:mm')}
                            </span>
                            <Badge variant={statusVariant} className="text-[10px] px-1.5 py-0">
                              {statusLabel}
                            </Badge>
                          </div>
                          <span className="text-xs font-bold text-foreground">
                            {formatCurrency(b.price_snapshot, tenant.currency)}
                          </span>
                        </div>

                        <div className="text-xs">
                          <span className="font-bold text-foreground block">
                            {b.service_name_snapshot}
                          </span>
                          <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {b.customer?.name || 'Клиент'}
                            </span>
                            {b.customer?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {b.customer.phone}
                              </span>
                            )}
                          </div>
                          {b.car_model && (
                            <div className="flex items-center gap-1 mt-0.5 text-muted-foreground text-[11px]">
                              <Car className="h-3 w-3 text-primary" />
                              <span>{b.car_model} {b.car_plate ? `(${b.car_plate})` : ''}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end text-[11px] text-primary pt-1 border-t border-border/40">
                          <span>Управление заказом</span>
                          <ChevronRight className="h-3 w-3 ml-0.5" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
