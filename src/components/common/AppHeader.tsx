import React from 'react';
import { studioConfig } from '@/config/studio.config';
import { Phone, MapPin } from 'lucide-react';

export const AppHeader: React.FC = () => {
  return (
    <header className="w-full bg-[#090b10]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0 p-0.5">
          <img
            src={studioConfig.branding.logoUrl}
            alt={studioConfig.name}
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">
            {studioConfig.name}
          </h1>
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
            <MapPin className="h-3 w-3 text-amber-400" />
            <span className="truncate max-w-[200px]">{studioConfig.city}, {studioConfig.address}</span>
          </div>
        </div>
      </div>

      <a
        href={`tel:${studioConfig.phone}`}
        className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
      >
        <Phone className="h-3.5 w-3.5 text-amber-400" />
        <span className="hidden sm:inline">{studioConfig.phone}</span>
      </a>
    </header>
  );
};

export default AppHeader;
