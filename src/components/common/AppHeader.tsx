import React from 'react';
import { useDemoStore } from '@/context/DemoStoreContext';
import { Phone, MapPin } from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { studio } = useDemoStore();

  return (
    <header className="w-full bg-[#090b10]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0 p-0.5">
          <img
            src={studio.logoUrl}
            alt={studio.name}
            className="h-full w-full object-contain"
            onError={(e) => {
              // Fallback to SVG monogram on load error
              (e.currentTarget as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%2309090b"/><text x="50%" y="55%" font-size="36" font-weight="900" fill="%23fbbf24" text-anchor="middle" dominant-baseline="middle">${studio.shortName.slice(0, 2).toUpperCase()}</text></svg>`;
            }}
          />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">
            {studio.name}
          </h1>
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
            <MapPin className="h-3 w-3 text-amber-400" />
            <span className="truncate max-w-[200px]">{studio.branch.city}, {studio.branch.address}</span>
          </div>
        </div>
      </div>

      <a
        href={`tel:${studio.branch.phone}`}
        className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
      >
        <Phone className="h-3.5 w-3.5 text-amber-400" />
        <span className="hidden sm:inline">{studio.branch.phone}</span>
      </a>
    </header>
  );
};

export default AppHeader;
