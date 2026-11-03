import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  AlertCircle,
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

// 2-letter Russian weekday abbreviations capitalized: Пт, Сб, Вс, Пн, Вт, Ср, Чт
const RU_WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export const SlotPicker: React.FC<SlotPickerProps> = ({
  selectedDate,
  onSelectDate,
  selectedSlotTime,
  onSelectSlot,
  slots = [],
  isLoading,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(selectedDate));
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  const today = useMemo(() => startOfToday(), []);
  const maxDate = useMemo(() => addDays(today, 30), [today]);

  // Generate 7 days strip starting from today (or centered/sliding if selected date is further)
  const sevenDays = useMemo(() => {
    const selDateObj = new Date(selectedDate);
    const diffDays = Math.max(0, Math.floor((selDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    // If selected date is within next 7 days, show days 0..6. Otherwise slide so selected date is visible.
    const startOffset = diffDays < 7 ? 0 : Math.min(diffDays - 3, 23);

    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, startOffset + i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const weekdayStr = RU_WEEKDAYS_SHORT[d.getDay()];
      const dayNumber = format(d, 'd');
      return { d, dateStr, weekdayStr, dayNumber };
    });
  }, [today, selectedDate]);

  // Days for the full interactive Month Calendar view
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [calendarMonth]);

  // Filter ONLY truly available slots
  const availableSlotsOnly = useMemo(() => {
    return slots.filter((s) => s.is_available);
  }, [slots]);

  // Format full date label like "25 сент. 2026г."
  const formattedFullDate = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      return format(d, "d MMM yyyy'г.'", { locale: ru });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const handleOpenNativePicker = () => {
    if (hiddenDateInputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          hiddenDateInputRef.current.showPicker();
          return;
        } catch {
          // fallback
        }
      }
      hiddenDateInputRef.current.focus();
      hiddenDateInputRef.current.click();
    } else {
      setIsCalendarOpen(!isCalendarOpen);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* ==================================================================== */}
      {/* 1. Exactly 7 Day Cards Row (Matching Photo 1)                       */}
      {/* ==================================================================== */}
      <div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {sevenDays.map((item) => {
            const isSelected = item.dateStr === selectedDate;
            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => onSelectDate(item.dateStr)}
                className={cn(
                  "flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all duration-150 select-none active:scale-95",
                  isSelected
                    ? "bg-[#2563eb] text-white shadow-[0_4px_16px_rgba(37,99,235,0.45)] ring-1 ring-blue-400/40"
                    : "bg-[#131722]/80 border border-white/10 text-white hover:bg-[#1c2233] hover:border-white/20"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium tracking-tight mb-0.5",
                    isSelected ? "text-white" : "text-zinc-400"
                  )}
                >
                  {item.weekdayStr}
                </span>
                <span
                  className={cn(
                    "text-lg font-bold leading-tight",
                    isSelected ? "text-white" : "text-white"
                  )}
                >
                  {item.dayNumber}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action: "Другая дата" (Left aligned) and Native Date Input */}
        <div className="flex items-center justify-between mt-2 px-0.5">
          <div className="relative">
            <button
              type="button"
              onClick={handleOpenNativePicker}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-medium select-none"
            >
              <span>Другая дата</span>
            </button>
            <input
              ref={hiddenDateInputRef}
              type="date"
              value={selectedDate}
              min={format(today, 'yyyy-MM-dd')}
              max={format(maxDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  onSelectDate(e.target.value);
                }
              }}
              className="absolute -top-1 left-0 opacity-0 pointer-events-none w-0 h-0"
              tabIndex={-1}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
          >
            <CalendarDays className="h-3 w-3" />
            <span>{isCalendarOpen ? 'Скрыть календарь' : 'Календарь'}</span>
          </button>
        </div>

        {/* Optional Month Calendar Popover / Dropdown */}
        {isCalendarOpen && (
          <div className="p-3.5 rounded-2xl border border-white/15 bg-[#121622] my-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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

            <div className="grid grid-cols-7 gap-1 text-center py-2 text-[11px] font-bold text-zinc-500">
              <span>Пн</span>
              <span>Вт</span>
              <span>Ср</span>
              <span>Чт</span>
              <span>Пт</span>
              <span className="text-zinc-400">Сб</span>
              <span className="text-zinc-400">Вс</span>
            </div>

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
                      isSelected && "bg-[#2563eb] text-white font-extrabold shadow-[0_0_14px_rgba(37,99,235,0.5)]"
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Centered Selected Date Summary Header (Matching Photo 1: "25 сент. 2026г.") */}
        <div className="text-center pt-3 pb-1 border-t border-white/[0.06] mt-3">
          <span className="text-sm text-zinc-300 font-medium">
            {formattedFullDate}
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. Time Slots Section (Horizontal Row Matching Date Selector)        */}
      {/* ==================================================================== */}
      <div>
        {isLoading ? (
          <div className="flex gap-2 overflow-hidden py-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-20 shrink-0 rounded-2xl bg-[#131722]" />
            ))}
          </div>
        ) : availableSlotsOnly.length === 0 ? (
          <div className="p-4 rounded-2xl border border-white/10 bg-[#131722]/70 text-center text-xs text-zinc-400 flex flex-col items-center gap-1.5">
            <AlertCircle className="h-5 w-5 text-zinc-500" />
            <span className="font-semibold text-zinc-300">На эту дату нет свободных окон</span>
            <span className="text-[11px] text-zinc-500 max-w-xs">
              Все боксы заняты или студия закрыта. Пожалуйста, выберите другую дату.
            </span>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center gap-2 overflow-x-auto pb-2.5 pt-1 scrollbar-none snap-x touch-pan-x -mx-1 px-1">
              {availableSlotsOnly.map((slot) => {
                const isSelected = selectedSlotTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => onSelectSlot(slot)}
                    className={cn(
                      "shrink-0 min-w-[80px] h-12 rounded-2xl border text-sm font-bold transition-all flex items-center justify-center select-none active:scale-95 snap-start",
                      isSelected
                        ? "bg-[#2563eb] border-blue-400 text-white font-extrabold shadow-[0_4px_16px_rgba(37,99,235,0.45)] ring-1 ring-blue-400/40"
                        : "bg-[#131722]/80 border-white/10 text-white hover:bg-[#1c2233] hover:border-white/20"
                    )}
                  >
                    <span>{slot.display_time}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
