import React from 'react';
import { cn } from '@/lib/utils';
import { Car } from 'lucide-react';

export type VehicleCategory = 'sedan' | 'crossover' | 'suv';

interface VehicleTypeSelectorProps {
  value: VehicleCategory;
  onChange: (value: VehicleCategory) => void;
}

const VEHICLES: Array<{
  id: VehicleCategory;
  name: string;
  hint: string;
  iconSrc: string;
}> = [
  {
    id: 'sedan',
    name: 'Седан',
    hint: 'Седан, купе, хэтчбек',
    iconSrc: '/icons/sedan.png',
  },
  {
    id: 'crossover',
    name: 'Кроссовер',
    hint: 'Компактный паркетник',
    iconSrc: '/icons/crossover.png',
  },
  {
    id: 'suv',
    name: 'Внедорожник',
    hint: 'Большой SUV, рамный 4x4',
    iconSrc: '/icons/suv.png',
  },
];

export const VehicleTypeSelector: React.FC<VehicleTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5 text-white" />
          <span>Класс автомобиля</span>
        </label>
        <span className="text-[11px] text-zinc-500 font-medium">Влияет на время и бокс</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {VEHICLES.map((v) => {
          const isSelected = value === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onChange(v.id)}
              className={cn(
                "group relative flex flex-col items-center justify-between min-h-[98px] p-3 rounded-2xl border text-center transition-all duration-200 active:scale-95 select-none",
                isSelected
                  ? "border-white bg-white/[0.08] text-white shadow-[0_0_16px_rgba(255,255,255,0.12)] ring-1 ring-white/30"
                  : "border-white/[0.08] bg-[#151518] text-zinc-400 hover:border-white/20 hover:text-white hover:bg-[#1a1a1e]"
              )}
            >
              {/* Silhouette Icon from user's reference */}
              <div className="h-9 w-full flex items-center justify-center">
                <img
                  src={v.iconSrc}
                  alt={v.name}
                  className={cn(
                    "h-7 w-auto max-w-[56px] object-contain filter invert transition-all duration-200",
                    isSelected
                      ? "opacity-100 scale-105 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      : "opacity-45 group-hover:opacity-80"
                  )}
                />
              </div>

              {/* Title & Hint */}
              <div className="w-full mt-1.5">
                <span
                  className={cn(
                    "text-xs font-bold block leading-tight",
                    isSelected ? "text-white" : "text-zinc-200"
                  )}
                >
                  {v.name}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5 truncate leading-tight">
                  {v.hint}
                </span>
              </div>

              {/* Active subtle check badge */}
              {isSelected && (
                <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
