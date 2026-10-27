import React from 'react';
import { cn } from '@/lib/utils';
import { Car, ShieldCheck } from 'lucide-react';
import { DbService } from '@/types/database';
import { VehicleCategory, getServicePriceForClass, VEHICLE_NAMES } from '@/lib/pricing';
import { formatCurrency } from '@/lib/utils';

export type { VehicleCategory };

interface VehicleTypeSelectorProps {
  value: VehicleCategory;
  onChange: (value: VehicleCategory) => void;
  service?: DbService | null;
  currency?: string;
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
    hint: 'Седан, купе',
    iconSrc: '/icons/sedan.png',
  },
  {
    id: 'crossover',
    name: 'Кроссовер',
    hint: 'Паркетник',
    iconSrc: '/icons/crossover.png',
  },
  {
    id: 'suv',
    name: 'Внедорожник',
    hint: 'Большой SUV',
    iconSrc: '/icons/suv.png',
  },
];

export const VehicleTypeSelector: React.FC<VehicleTypeSelectorProps> = ({
  value,
  onChange,
  service,
  currency = 'RUB',
}) => {
  const currentPrice = service
    ? getServicePriceForClass(service.price, service.name, value)
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5 text-white" />
          <span>Класс автомобиля</span>
        </label>
        <span className="text-[11px] text-zinc-500 font-medium">Точная цена под ваш авто</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {VEHICLES.map((v) => {
          const isSelected = value === v.id;
          const tierPrice = service
            ? getServicePriceForClass(service.price, service.name, v.id)
            : null;

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onChange(v.id)}
              className={cn(
                "group relative flex flex-col items-center justify-between min-h-[105px] p-2.5 rounded-2xl border text-center transition-all duration-200 active:scale-95 select-none",
                isSelected
                  ? "border-white bg-white/[0.08] text-white shadow-[0_0_16px_rgba(255,255,255,0.12)] ring-1 ring-white/30"
                  : "border-white/[0.08] bg-[#151518] text-zinc-400 hover:border-white/20 hover:text-white hover:bg-[#1a1a1e]"
              )}
            >
              {/* Silhouette Icon from user's reference */}
              <div className="h-7 w-full flex items-center justify-center mt-0.5">
                <img
                  src={v.iconSrc}
                  alt={v.name}
                  className={cn(
                    "h-6 w-auto max-w-[50px] object-contain filter invert transition-all duration-200",
                    isSelected
                      ? "opacity-100 scale-105 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      : "opacity-45 group-hover:opacity-80"
                  )}
                />
              </div>

              {/* Title & Hint */}
              <div className="w-full mt-1">
                <span
                  className={cn(
                    "text-xs font-bold block leading-tight",
                    isSelected ? "text-white" : "text-zinc-200"
                  )}
                >
                  {v.name}
                </span>

                {/* Live price for this specific vehicle tier */}
                {tierPrice !== null ? (
                  <span
                    className={cn(
                      "text-[11px] font-black block mt-0.5 leading-tight",
                      isSelected ? "text-emerald-400" : "text-zinc-400"
                    )}
                  >
                    {formatCurrency(tierPrice, currency)}
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 block mt-0.5 truncate leading-tight">
                    {v.hint}
                  </span>
                )}
              </div>

              {/* Active subtle check badge */}
              {isSelected && (
                <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Prominent Price Banner directly on booking */}
      {currentPrice !== null && (
        <div className="mt-2.5 p-3 rounded-2xl bg-[#12141c] border border-white/10 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] text-zinc-400 block leading-tight">
                Стоимость для {VEHICLE_NAMES[value].toLowerCase()}а:
              </span>
              <span className="text-xs font-extrabold text-white">
                Фиксированная цена
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-base sm:text-lg font-black text-white">
              {formatCurrency(currentPrice, currency)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
