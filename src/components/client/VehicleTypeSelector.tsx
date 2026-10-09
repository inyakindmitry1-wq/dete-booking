import React from 'react';
import { cn } from '@/lib/utils';
import { Car } from 'lucide-react';

export type VehicleCategory = 'sedan' | 'crossover' | 'suv';

interface VehicleTypeSelectorProps {
  value: VehicleCategory;
  onChange: (value: VehicleCategory) => void;
}

const VEHICLES: Array<{ id: VehicleCategory; name: string; hint: string }> = [
  { id: 'sedan', name: 'Седан', hint: 'Седан, хэтчбек, купе' },
  { id: 'crossover', name: 'Кроссовер', hint: 'Компактный SUV' },
  { id: 'suv', name: 'Внедорожник', hint: 'Большой SUV, минивэн' },
];

export const VehicleTypeSelector: React.FC<VehicleTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2 flex items-center gap-1.5">
        <Car className="h-3.5 w-3.5 text-primary" />
        <span>Класс автомобиля</span>
      </label>

      <div className="grid grid-cols-3 gap-2">
        {VEHICLES.map((v) => {
          const isSelected = value === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onChange(v.id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all active:scale-95",
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                  : "border-border bg-secondary/50 text-muted-foreground hover:border-border/80 hover:text-foreground"
              )}
            >
              <Car className={cn("h-5 w-5 mb-1", isSelected ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs font-semibold text-foreground">{v.name}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{v.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
