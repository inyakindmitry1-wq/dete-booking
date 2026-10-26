import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { DbTenant } from '@/types/database';

interface AIBannerProps {
  tenant: DbTenant;
  onOpenAI: () => void;
}

export const AIBanner: React.FC<AIBannerProps> = ({ tenant, onOpenAI }) => {
  return (
    <div
      onClick={onOpenAI}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenAI();
        }
      }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] hover:border-white/20 bg-gradient-to-r from-[#121316] via-[#16171c] to-[#121316] p-4 backdrop-blur-xl shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.99] select-none"
    >
      {/* Subtle monochrome ambient light in background */}
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/[0.04] blur-2xl pointer-events-none group-hover:bg-white/[0.07] transition-all duration-500" />
      <div className="absolute -left-6 -bottom-6 h-20 w-20 rounded-full bg-white/[0.02] blur-xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-3">
        {/* Text Information Block */}
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug group-hover:text-zinc-200 transition-colors">
            Свежий вид для вашего авто
          </h3>
          <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            Выберите услугу и удобное время — остальное возьмём на себя
          </p>
        </div>

        {/* Circular Glowing Sparkle Capsule */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] border border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.08)] group-hover:scale-105 group-hover:border-white/40 transition-transform duration-300">
          <Sparkles className="h-5 w-5 text-white animate-pulse" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
        </div>
      </div>
    </div>
  );
};
