import React, { useState } from 'react';
import { cn, formatCurrency, assetUrl } from '@/lib/utils';
import { Car, ShieldCheck } from 'lucide-react';
import { DbService } from '@/types/database';
import { VehicleCategory, getServicePriceForClass, VEHICLE_NAMES } from '@/lib/pricing';

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

function VehicleIconFallback({ category, className }: { category: VehicleCategory; className?: string }) {
  if (category === 'sedan') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7c-.6 0-1.1.2-1.5.6L3.5 10C2.6 10.3 2 11.1 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    );
  }
  if (category === 'crossover') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 17h2c.6 0 1-.4 1-1v-4c0-.9-.7-1.7-1.5-1.9l-3.2-.8c-.7-.2-1.5-.7-1.9-1.3L13.8 6.2c-.4-.5-1-.8-1.7-.8H7c-.7 0-1.3.4-1.7.9L3.2 9.8C2.5 10.2 2 11 2 11.8V16c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2.2" />
        <circle cx="17" cy="17" r="2.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 17h2c.6 0 1-.4 1-1V9.5c0-.8-.6-1.5-1.4-1.6L16 7.2c-.6-.1-1.2-.5-1.5-1L13.2 4.5C12.8 4.2 12.3 4 11.8 4H5c-.8 0-1.5.6-1.7 1.4L2.2 10.5C2.1 10.9 2 11.3 2 11.7V16c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2.3" />
      <circle cx="17" cy="17" r="2.3" />
    </svg>
  );
}

export const VehicleTypeSelector: React.FC<VehicleTypeSelectorProps> = ({
  value,
  onChange,
  service,
  currency = 'RUB',
}) => {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
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
                {imgErrors[v.id] ? (
                  <VehicleIconFallback
                    category={v.id}
                    className={cn(
                      "h-6 w-auto max-w-[50px] transition-all duration-200",
                      isSelected
                        ? "text-white opacity-100 scale-105"
                        : "text-zinc-400 opacity-60 group-hover:opacity-90"
                    )}
                  />
                ) : (
                  <img
                    src={assetUrl(v.iconSrc)}
                    alt={v.name}
                    loading="eager"
                    onError={() => setImgErrors((prev) => ({ ...prev, [v.id]: true }))}
                    className={cn(
                      "h-6 w-auto max-w-[50px] object-contain filter invert transition-all duration-200",
                      isSelected
                        ? "opacity-100 scale-105 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        : "opacity-55 group-hover:opacity-85"
                    )}
                  />
                )}
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
                      "text-[11px] font-black block mt-0.5 leading-tight whitespace-nowrap",
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

          <div className="text-right shrink-0 whitespace-nowrap">
            <span className="text-base sm:text-lg font-black text-white whitespace-nowrap">
              {formatCurrency(currentPrice, currency)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
