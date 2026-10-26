import React from 'react';
import { cn } from '@/lib/utils';
import { Car } from 'lucide-react';

export type VehicleCategory = 'sedan' | 'crossover' | 'suv';

interface VehicleTypeSelectorProps {
  value: VehicleCategory;
  onChange: (value: VehicleCategory) => void;
}

// 1. Sedan Icon: Low, elongated, aerodynamic three-box silhouette
function SedanIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Sleek low roofline with front and rear windshields */}
      <path d="M2 13h3.5l1.8-3.2c.6-1.1 1.7-1.8 3-1.8h9.4c1.3 0 2.4.7 3 1.8l1.8 3.2H30" />
      {/* Body baseline */}
      <path d="M2 13v2.5a1 1 0 0 0 1 1h2.5" />
      <path d="M10.5 16.5h11" />
      <path d="M26.5 16.5H29a1 1 0 0 0 1-1V13" />
      {/* Wheels with disc brakes */}
      <circle cx="8" cy="16.5" r="2.5" />
      <circle cx="24" cy="16.5" r="2.5" />
      {/* Window divider */}
      <line x1="15.5" y1="8" x2="15" y2="13" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

// 2. Crossover Icon: Elevated ground clearance, curved hatchback roofline, roof rails
function CrossoverIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Elevated roofline curving down into a compact tailgate */}
      <path d="M2 12.5h3.5l2.2-4.5c.6-1.2 1.8-2 3.1-2h8.4c1.3 0 2.5.8 3.1 2l2.2 4.5H30" />
      {/* Roof rails */}
      <path d="M10 4.5h12" strokeWidth="1.4" opacity="0.75" />
      {/* High-clearance underbody */}
      <path d="M2 12.5v2.8a1 1 0 0 0 1 1h2.5" />
      <path d="M11 16.3h10" />
      <path d="M26.5 16.3H29a1 1 0 0 0 1-1V12.5" />
      {/* Wheels */}
      <circle cx="8.5" cy="16.3" r="2.5" />
      <circle cx="23.5" cy="16.3" r="2.5" />
      {/* Windows divider */}
      <line x1="16" y1="6" x2="15.5" y2="12.5" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

// 3. SUV / Off-roader Icon: Tall, boxy 4x4 frame, rugged stance, squared-off cargo rear
function SuvIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Tall upright windshield and squared-off 4x4 rear box */}
      <path d="M2 12.5h3l2-5.7c.4-1.1 1.4-1.8 2.6-1.8H26a1.2 1.2 0 0 1 1.2 1.2V12.5H30" />
      {/* Roof carrier rail */}
      <path d="M8 3.5h16" strokeWidth="1.5" />
      <line x1="10" y1="3.5" x2="10" y2="5" strokeWidth="1.2" />
      <line x1="22" y1="3.5" x2="22" y2="5" strokeWidth="1.2" />
      {/* Heavy-duty undercarriage */}
      <path d="M2 12.5v3a1 1 0 0 0 1 1h2.2" />
      <path d="M11.2 16.5h9.6" />
      <path d="M26.2 16.5H29a1 1 0 0 0 1-1V12.5" />
      {/* Big offroad wheels */}
      <circle cx="8.2" cy="16.5" r="3" strokeWidth="2" />
      <circle cx="23.2" cy="16.5" r="3" strokeWidth="2" />
      {/* Dual upright pillar lines */}
      <line x1="15" y1="5" x2="14.5" y2="12.5" strokeWidth="1.4" opacity="0.6" />
      <line x1="21" y1="5" x2="20.5" y2="12.5" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

const VEHICLES: Array<{
  id: VehicleCategory;
  name: string;
  hint: string;
  icon: React.FC<{ className?: string }>;
}> = [
  {
    id: 'sedan',
    name: 'Седан',
    hint: 'Седан, купе, хэтчбек',
    icon: SedanIcon,
  },
  {
    id: 'crossover',
    name: 'Кроссовер',
    hint: 'Компактный паркетник',
    icon: CrossoverIcon,
  },
  {
    id: 'suv',
    name: 'Внедорожник',
    hint: 'Большой SUV, рамный 4x4',
    icon: SuvIcon,
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
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onChange(v.id)}
              className={cn(
                "relative flex flex-col items-center justify-between min-h-[96px] p-3 rounded-2xl border text-center transition-all duration-200 active:scale-95 select-none",
                isSelected
                  ? "border-white bg-white/[0.08] text-white shadow-[0_0_16px_rgba(255,255,255,0.12)] ring-1 ring-white/30"
                  : "border-white/[0.08] bg-[#151518] text-zinc-400 hover:border-white/20 hover:text-white hover:bg-[#1a1a1e]"
              )}
            >
              {/* Silhouette Icon */}
              <div
                className={cn(
                  "h-9 w-full flex items-center justify-center transition-colors",
                  isSelected ? "text-white" : "text-zinc-400"
                )}
              >
                <Icon className="h-6 w-11 transition-transform group-hover:scale-105" />
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
                <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
