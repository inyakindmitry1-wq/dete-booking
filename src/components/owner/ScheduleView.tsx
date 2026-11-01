import React, { useState, useRef, useMemo } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DbResource, DbBooking, DbResourceOccupancy, DbTenant, DbService } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Lock,
  Clock,
  Car,
  Phone,
  Calendar,
  AlertCircle,
  Sliders,
  MapPin,
} from 'lucide-react';

interface ScheduleViewProps {
  tenant: DbTenant;
  selectedDate: string;
  onDateChange: (date: string) => void;
  resources: DbResource[];
  bookings: DbBooking[];
  occupancies: DbResourceOccupancy[];
  onSelectBooking: (booking: DbBooking) => void;
  onOpenManualBooking?: () => void;
  onOpenManualBlock?: () => void;
  onOpenSettingsTab?: (tab: 'hours' | 'contacts' | 'services') => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  tenant,
  selectedDate,
  onDateChange,
  resources,
  bookings,
  occupancies,
  onSelectBooking,
  onOpenManualBooking,
  onOpenManualBlock,
  onOpenSettingsTab,
}) => {
  const [isWeekView, setIsWeekView] = useState(false);
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  const selectedDateObj = useMemo(() => new Date(selectedDate), [selectedDate]);

  // Navigate date
  const handlePrev = () => {
    const delta = isWeekView ? -7 : -1;
    const nextD = addDays(selectedDateObj, delta);
    onDateChange(format(nextD, 'yyyy-MM-dd'));
  };

  const handleNext = () => {
    const delta = isWeekView ? 7 : 1;
    const nextD = addDays(selectedDateObj, delta);
    onDateChange(format(nextD, 'yyyy-MM-dd'));
  };

  const handleOpenDatePicker = () => {
    if (hiddenDateRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          hiddenDateRef.current.showPicker();
          return;
        } catch {
          // ignore
        }
      }
      hiddenDateRef.current.focus();
      hiddenDateRef.current.click();
    }
  };

  // Week days for week view (Monday to Sunday)
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDateObj, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDateObj, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDateObj]);

  // Calculate KPI stats (Arrivals, Completed, Received)
  const stats = useMemo(() => {
    const arrivals = bookings.filter((b) => b.status !== 'cancelled').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    // Calculate received: sum of completed bookings or payments
    const received = bookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + (b.price_snapshot || 0), 0);

    return { arrivals, completed, received };
  }, [bookings]);

  return (
    <div className="space-y-4 pb-12">
      {/* ==================================================================== */}
      {/* 1. DATE TOOLBAR (Matching Reference: Prev, Date, Next, Day/Week)     */}
      {/* ==================================================================== */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrev}
            aria-label="Предыдущий день"
            className="h-10 w-10 rounded-xl bg-[#131722] border border-white/10 text-zinc-300 hover:text-white shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="relative flex-1 min-w-0">
            <button
              type="button"
              onClick={handleOpenDatePicker}
              className="w-full h-10 px-3 rounded-xl bg-[#131722] border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-1.5 hover:bg-[#1c2233] transition-colors truncate"
            >
              <Calendar className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span className="truncate capitalize">
                {isWeekView
                  ? `Неделя ${format(weekDays[0], 'd MMM', { locale: ru })} – ${format(weekDays[6], 'd MMM', { locale: ru })}`
                  : format(selectedDateObj, 'd MMMM yyyy', { locale: ru })}
              </span>
            </button>
            <input
              ref={hiddenDateRef}
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  onDateChange(e.target.value);
                }
              }}
              className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
              tabIndex={-1}
            />
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleNext}
            aria-label="Следующий день"
            className="h-10 w-10 rounded-xl bg-[#131722] border border-white/10 text-zinc-300 hover:text-white shrink-0"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* View Toggle: "День" / "Неделя" */}
        <div className="flex items-center p-1 rounded-xl bg-[#131722] border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setIsWeekView(false)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none",
              !isWeekView
                ? "bg-[#2563eb] text-white shadow-sm font-bold"
                : "text-zinc-400 hover:text-white"
            )}
          >
            День
          </button>
          <button
            type="button"
            onClick={() => setIsWeekView(true)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none",
              isWeekView
                ? "bg-[#2563eb] text-white shadow-sm font-bold"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Неделя
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. STATS KPI ROW (Matching Reference: Заезды | Выполнено | Получено) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#0e121a] border border-white/10 space-y-1">
          <span className="text-xs text-zinc-400 font-medium block">
            Заезды
          </span>
          <span className="text-xl font-bold text-white block">
            {stats.arrivals}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e121a] border border-white/10 space-y-1">
          <span className="text-xs text-zinc-400 font-medium block">
            Выполнено
          </span>
          <span className="text-xl font-bold text-emerald-400 block">
            {stats.completed}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e121a] border border-white/10 space-y-1">
          <span className="text-xs text-zinc-400 font-medium block">
            Получено
          </span>
          <span className="text-xl font-bold text-white block truncate">
            {formatCurrency(stats.received, tenant.currency)}
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. QUICK ACTION TOOLBAR (Add booking, Lock Bay, Settings buttons)     */}
      {/* ==================================================================== */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {onOpenManualBooking && (
          <Button
            size="sm"
            onClick={onOpenManualBooking}
            className="h-10 px-3.5 rounded-xl text-xs font-bold bg-[#2563eb] hover:bg-blue-500 text-white shadow-sm gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Добавить запись</span>
          </Button>
        )}

        {onOpenManualBlock && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenManualBlock}
            className="h-10 px-3 rounded-xl text-xs font-semibold bg-[#131722] hover:bg-[#1c2233] text-zinc-300 hover:text-white border border-white/10 gap-1.5"
          >
            <Lock className="h-3.5 w-3.5 text-zinc-400" />
            <span>Заблокировать бокс</span>
          </Button>
        )}

        {onOpenSettingsTab && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenSettingsTab('hours')}
              className="h-10 px-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-[#131722] hover:bg-[#1c2233] border border-white/10"
              title="Часы работы"
            >
              <Clock className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenSettingsTab('contacts')}
              className="h-10 px-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-[#131722] hover:bg-[#1c2233] border border-white/10"
              title="Контакты"
            >
              <MapPin className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenSettingsTab('services')}
              className="h-10 px-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-[#131722] hover:bg-[#1c2233] border border-white/10"
              title="Услуги"
            >
              <Sliders className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 4. BAY SCHEDULE & BOOKINGS (Day View or Week View)                    */}
      {/* ==================================================================== */}
      {!isWeekView ? (
        // DAY VIEW: ORGANIZED BY BAYS
        <div className="space-y-4 pt-2">
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
                {/* Bay Header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    <span>{res.name}</span>
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {bayBookings.length} {bayBookings.length === 1 ? 'запись' : 'записей'}
                  </span>
                </div>

                {bayBookings.length === 0 && bayBlocks.length === 0 ? (
                  <div className="p-3.5 rounded-2xl border border-white/10 bg-[#0e121a]/60 text-center text-xs text-zinc-500">
                    Пост свободен на выбранную дату
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Manual Blocks */}
                    {bayBlocks.map((block) => (
                      <div
                        key={block.id}
                        className="p-3.5 rounded-2xl border border-dashed border-red-500/30 bg-red-500/5 flex items-center gap-3 text-xs text-red-300"
                      >
                        <Lock className="h-4 w-4 shrink-0 text-red-400" />
                        <div>
                          <span className="font-bold block">
                            Блокировка поста ({format(new Date(block.start_time), 'HH:mm')} – {format(new Date(block.end_time), 'HH:mm')})
                          </span>
                          <span className="text-[11px] text-red-400/80">
                            {block.note || 'Технический перерыв'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Bookings */}
                    {bayBookings.map((b) => {
                      const startTime = format(new Date(b.start_time), 'HH:mm');
                      const endTime = format(new Date(b.end_time), 'HH:mm');

                      const statusColor =
                        b.status === 'confirmed'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : b.status === 'checked_in'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : b.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-700/30 text-zinc-400 border-zinc-600/30';

                      const statusText =
                        b.status === 'confirmed'
                          ? 'Подтверждена'
                          : b.status === 'checked_in'
                          ? 'В работе'
                          : b.status === 'completed'
                          ? 'Выполнен'
                          : 'Отменена';

                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => onSelectBooking(b)}
                          className="w-full text-left p-4 rounded-2xl border border-white/10 bg-[#0e121a] hover:bg-[#141a26] hover:border-white/20 transition-all select-none space-y-2.5 active:scale-[0.99] shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                              {startTime} — {endTime}
                            </span>
                            <Badge variant="outline" className={cn("text-[10px] font-semibold", statusColor)}>
                              {statusText}
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white tracking-tight">
                              {b.service_name_snapshot}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-zinc-400 pt-0.5">
                              <span>
                                {b.car_model || 'Автомобиль не указан'}
                                {b.car_plate ? ` (${b.car_plate})` : ''}
                              </span>
                              <span className="font-bold text-white">
                                {formatCurrency(b.price_snapshot, tenant.currency)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-xs text-zinc-400">
                            <span>{b.customer?.name || 'Клиент'}</span>
                            <span className="text-zinc-500">{b.customer?.phone}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {bookings.length === 0 && (
            <div className="py-8 text-center space-y-3">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#131722] border border-white/10 text-zinc-400">
                <AlertCircle className="h-6 w-6 text-zinc-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  Записей пока нет
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Новые записи клиентов появятся здесь. Можно добавить запись вручную.
                </p>
              </div>
              {onOpenManualBooking && (
                <Button
                  size="sm"
                  onClick={onOpenManualBooking}
                  className="rounded-xl h-10 px-4 text-xs font-bold bg-[#2563eb] text-white"
                >
                  + Добавить запись
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        // WEEK VIEW: 7 DAYS OVERVIEW
        <div className="space-y-3 pt-2">
          {weekDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isToday = isSameDay(day, new Date());
            const isCurrentSelected = dayStr === selectedDate;
            const dayBookings = bookings.filter((b) => b.start_time.startsWith(dayStr));

            return (
              <div
                key={dayStr}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all space-y-2",
                  isCurrentSelected
                    ? "bg-[#141a26] border-blue-500/40 shadow-sm"
                    : "bg-[#0e121a] border-white/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white capitalize">
                      {format(day, 'EEEE, d MMM', { locale: ru })}
                    </span>
                    {isToday && (
                      <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0">
                        Сегодня
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">
                    {dayBookings.length} {dayBookings.length === 1 ? 'запись' : 'записей'}
                  </span>
                </div>

                {dayBookings.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Нет записей</p>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {dayBookings.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => onSelectBooking(b)}
                        className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 text-left flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-white block truncate">
                            {format(new Date(b.start_time), 'HH:mm')} • {b.service_name_snapshot}
                          </span>
                          <span className="text-[11px] text-zinc-400 truncate block">
                            {b.customer?.name} • {b.car_model || 'Авто'}
                          </span>
                        </div>
                        <span className="font-bold text-white shrink-0">
                          {formatCurrency(b.price_snapshot, tenant.currency)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
