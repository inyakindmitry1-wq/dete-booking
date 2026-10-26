import React, { useState, useMemo } from 'react';
import {
  format,
  addDays,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isBefore,
  isAfter,
  startOfToday,
  addMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { TimeSlot } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  Sunrise,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';

interface SlotPickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedSlotTime: string | null; // ISO string
  onSelectSlot: (slot: TimeSlot) => void;
  slots: TimeSlot[] | undefined;
  isLoading: boolean;
}

type TimePeriodFilter = 'all' | 'morning' | 'afternoon' | 'evening';

export const SlotPicker: React.FC<SlotPickerProps> = ({
  selectedDate,
  onSelectDate,
  selectedSlotTime,
  onSelectSlot,
  slots = [],
  isLoading,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState<TimePeriodFilter>('all');
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(selectedDate));

  const today = useMemo(() => startOfToday(), []);
  const maxDate = useMemo(() => addDays(today, 30), [today]);

  // Generate 30 days horizon for the horizontal swipe strip
  const daysHorizon = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = addDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayName =
        i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : format(d, 'EE', { locale: ru });
      const dayNumber = format(d, 'd MMM', { locale: ru });
      return { d, dateStr, dayName, dayNumber };
    });
  }, [today]);

  // Days for the full interactive Month Calendar view
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [calendarMonth]);

  // Categorize slots by time of day
  const { morningSlots, afternoonSlots, eveningSlots } = useMemo(() => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    slots.forEach((s) => {
      const hour = parseInt(s.display_time.split(':')[0], 10);
      if (hour < 12) {
        morning.push(s);
      } else if (hour < 17) {
        afternoon.push(s);
      } else {
        evening.push(s);
      }
    });

    return { morningSlots: morning, afternoonSlots: afternoon, eveningSlots: evening };
  }, [slots]);

  // Filtered slots list based on active tab
  const displayedSlots = useMemo(() => {
    if (activePeriod === 'morning') return morningSlots;
    if (activePeriod === 'afternoon') return afternoonSlots;
    if (activePeriod === 'evening') return eveningSlots;
    return slots;
  }, [activePeriod, slots, morningSlots, afternoonSlots, eveningSlots]);

  const availableCount = useMemo(() => {
    return slots.filter((s) => s.is_available).length;
  }, [slots]);

  return (
    <div className="space-y-4">
      {/* ==================================================================== */}
      {/* 1. Date Selection Section (30-day horizon + Month Calendar modal)      */}
      {/* ==================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-white" />
            <span>Выберите дату</span>
          </label>

          {/* Toggle Full Month Calendar Button */}
          <button
            type="button"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-[#161619] hover:bg-[#202025] active:scale-95 transition-all"
          >
            <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
            <span>{isCalendarOpen ? 'Скрыть календарь' : 'Весь месяц (30 дней)'}</span>
          </button>
        </div>

        {/* Option A: Full Month Calendar Dropdown / Grid */}
        {isCalendarOpen && (
          <div className="p-3.5 rounded-2xl border border-white/15 bg-[#121215] mb-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Calendar Month Navigation Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-sm font-extrabold text-white capitalize">
                {format(calendarMonth, 'LLLL yyyy', { locale: ru })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}
                  disabled={isSameDay(startOfMonth(calendarMonth), startOfMonth(today))}
                  className="p-1 rounded-lg border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  disabled={isAfter(startOfMonth(calendarMonth), startOfMonth(maxDate))}
                  className="p-1 rounded-lg border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 text-center py-2 text-[11px] font-bold text-zinc-500 uppercase">
              <span>Пн</span>
              <span>Вт</span>
              <span>Ср</span>
              <span>Чт</span>
              <span>Пт</span>
              <span className="text-zinc-400">Сб</span>
              <span className="text-zinc-400">Вс</span>
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isSelected = dayStr === selectedDate;
                const isPast = isBefore(day, today);
                const isBeyondHorizon = isAfter(day, maxDate);
                const isDisabled = isPast || isBeyondHorizon;

                return (
                  <button
                    key={dayStr}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      onSelectDate(dayStr);
                      setIsCalendarOpen(false);
                    }}
                    className={cn(
                      "h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all select-none",
                      isDisabled && "opacity-20 text-zinc-600 cursor-not-allowed",
                      !isDisabled && !isSelected && "text-zinc-300 hover:text-white hover:bg-white/10",
                      isSelected && "bg-white text-black font-extrabold shadow-md scale-105"
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Option B: 30-Day Horizontal Swipe Strip */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {daysHorizon.map((d) => {
            const isSelected = d.dateStr === selectedDate;
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => onSelectDate(d.dateStr)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[76px] py-2.5 px-3 rounded-2xl border text-center transition-all duration-200 shrink-0 active:scale-95 select-none",
                  isSelected
                    ? "border-white bg-white text-black font-bold shadow-[0_4px_20px_rgba(255,255,255,0.25)] ring-1 ring-white"
                    : "border-white/[0.08] bg-[#161619] text-zinc-400 hover:border-white/20 hover:text-white hover:bg-[#1f1f23]"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] uppercase font-bold tracking-tight",
                    isSelected ? "text-zinc-700" : "text-zinc-500"
                  )}
                >
                  {d.dayName}
                </span>
                <span
                  className={cn(
                    "text-xs font-black mt-0.5",
                    isSelected ? "text-black" : "text-zinc-200"
                  )}
                >
                  {d.dayNumber}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. Structured Time Slots Section (Period filters & Clean Grid)         */}
      {/* ==================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-white" />
            <span>Время визита</span>
          </label>

          {slots.length > 0 && !isLoading && (
            <span className="text-[11px] text-zinc-400 font-medium">
              Доступно окон: <strong className="text-white font-bold">{availableCount}</strong>
            </span>
          )}
        </div>

        {/* Period Filter Tabs */}
        {slots.length > 0 && !isLoading && (
          <div className="flex gap-1.5 p-1 rounded-xl bg-[#141417] border border-white/[0.08] mb-3">
            <button
              type="button"
              onClick={() => setActivePeriod('all')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all select-none text-center",
                activePeriod === 'all'
                  ? "bg-white text-black shadow-sm font-bold"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              Все ({slots.length})
            </button>

            {morningSlots.length > 0 && (
              <button
                type="button"
                onClick={() => setActivePeriod('morning')}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all select-none flex items-center justify-center gap-1",
                  activePeriod === 'morning'
                    ? "bg-white text-black shadow-sm font-bold"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Sunrise className="h-3 w-3" />
                <span>Утро</span>
              </button>
            )}

            {afternoonSlots.length > 0 && (
              <button
                type="button"
                onClick={() => setActivePeriod('afternoon')}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all select-none flex items-center justify-center gap-1",
                  activePeriod === 'afternoon'
                    ? "bg-white text-black shadow-sm font-bold"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Sun className="h-3 w-3" />
                <span>День</span>
              </button>
            )}

            {eveningSlots.length > 0 && (
              <button
                type="button"
                onClick={() => setActivePeriod('evening')}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all select-none flex items-center justify-center gap-1",
                  activePeriod === 'evening'
                    ? "bg-white text-black shadow-sm font-bold"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Moon className="h-3 w-3" />
                <span>Вечер</span>
              </button>
            )}
          </div>
        )}

        {/* Slot Grid / States */}
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-xl bg-zinc-900" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#141417] text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6 text-zinc-500" />
            <span className="font-semibold text-zinc-300">На эту дату нет свободных окон</span>
            <span className="text-[11px] text-zinc-500 max-w-xs">
              Все посты заняты или студия закрыта. Пожалуйста, выберите соседнюю дату.
            </span>
          </div>
        ) : displayedSlots.length === 0 ? (
          <div className="p-4 rounded-xl border border-white/[0.08] bg-[#141417] text-center text-xs text-zinc-400">
            В выбранном интервале нет окон. Переключитесь на «Все».
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
            {displayedSlots.map((slot) => {
              const isSelected = selectedSlotTime === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.is_available}
                  onClick={() => onSelectSlot(slot)}
                  className={cn(
                    "h-11 rounded-xl border text-sm font-bold transition-all flex items-center justify-center active:scale-95 select-none",
                    !slot.is_available &&
                      "opacity-25 bg-[#121214] border-white/5 text-zinc-600 cursor-not-allowed line-through",
                    slot.is_available &&
                      !isSelected &&
                      "border-white/[0.08] bg-[#17171a] text-zinc-100 hover:border-white/30 hover:bg-[#202025] hover:text-white shadow-sm",
                    slot.is_available &&
                      isSelected &&
                      "border-white bg-white text-black font-black shadow-[0_0_20px_rgba(255,255,255,0.35)] scale-[1.02]"
                  )}
                >
                  {slot.display_time}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
