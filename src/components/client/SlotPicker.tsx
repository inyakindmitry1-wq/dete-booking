import React from 'react';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TimeSlot } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface SlotPickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedSlotTime: string | null; // ISO string
  onSelectSlot: (slot: TimeSlot) => void;
  slots: TimeSlot[] | undefined;
  isLoading: boolean;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  selectedDate,
  onSelectDate,
  selectedSlotTime,
  onSelectSlot,
  slots = [],
  isLoading,
}) => {
  // Generate next 7 days for the date selector
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayName = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : format(d, 'EEEEEE', { locale: ru });
    const dayNumber = format(d, 'd MMM', { locale: ru });
    return { dateStr, dayName, dayNumber };
  });

  return (
    <div className="space-y-4">
      {/* 1. Date Selector Strip */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>Выберите дату</span>
        </label>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {days.map((d) => {
            const isSelected = d.dateStr === selectedDate;
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => onSelectDate(d.dateStr)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[72px] py-2 px-2.5 rounded-xl border text-center transition-all shrink-0 active:scale-95",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-border/80 hover:text-foreground"
                )}
              >
                <span className="text-[11px] uppercase capitalize">{d.dayName}</span>
                <span className="text-sm font-semibold mt-0.5 text-foreground">{d.dayNumber}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Available Slots Grid */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>Время записи</span>
        </label>

        {isLoading ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-xl" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="p-4 rounded-xl border border-border bg-secondary/40 text-center text-sm text-muted-foreground flex flex-col items-center gap-1.5">
            <AlertCircle className="h-5 w-5 text-muted-foreground/60" />
            <span>В этот день студия не работает или нет свободных мест</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
            {slots.map((slot) => {
              const isSelected = selectedSlotTime === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.is_available}
                  onClick={() => onSelectSlot(slot)}
                  className={cn(
                    "h-11 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center active:scale-95",
                    !slot.is_available && "opacity-35 bg-secondary/20 border-border/40 cursor-not-allowed line-through text-muted-foreground",
                    slot.is_available && !isSelected && "border-border bg-secondary/60 text-foreground hover:border-primary/50 hover:bg-secondary",
                    slot.is_available && isSelected && "border-primary bg-primary text-primary-foreground shadow-md"
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
