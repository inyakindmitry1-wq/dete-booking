import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDemoStore } from '@/context/DemoStoreContext';
import { ChevronDown, ShieldCheck, UserCheck, ExternalLink, Sparkles } from 'lucide-react';

export const DemoRoleBar: React.FC = () => {
  const { studio, allStudios, switchStudio } = useDemoStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isOwnerView = location.pathname.includes('/owner');

  const handleSelectStudio = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSlug = e.target.value;
    switchStudio(nextSlug);

    // Keep user in current view (client portal or owner portal) for the newly selected studio
    const targetPath = isOwnerView
      ? `/s/${nextSlug}/owner/?studio=${nextSlug}`
      : `/s/${nextSlug}/?studio=${nextSlug}`;

    navigate(targetPath);
  };

  const handleToggleRole = () => {
    if (isOwnerView) {
      navigate(`/s/${studio.slug}/?studio=${studio.slug}`);
    } else {
      navigate(`/s/${studio.slug}/owner/?studio=${studio.slug}`);
    }
  };

  return (
    <div className="w-full bg-[#07090e]/95 backdrop-blur-md border-b border-white/10 px-3 py-1.5 flex items-center justify-between text-xs z-50 sticky top-0">
      {/* Studio Selector Dropdown */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline">Студия:</span>
        </div>

        <div className="relative inline-flex items-center">
          <select
            value={studio.slug}
            onChange={handleSelectStudio}
            aria-label="Выбор детейлинг-студии"
            className="appearance-none bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg pl-2.5 pr-7 py-1 text-white font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
          >
            {allStudios.map((s) => (
              <option key={s.slug} value={s.slug} className="bg-zinc-900 text-white py-1">
                {s.name} ({s.branch.city})
              </option>
            ))}
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400 absolute right-2 pointer-events-none" />
        </div>

        {/* Studio Rating Badge */}
        {studio.branch.yandexRating && (
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 font-medium text-[11px] border border-amber-400/20">
            ★ {studio.branch.yandexRating}
          </span>
        )}
      </div>

      {/* Role / Portal Switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleRole}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/25 font-medium transition-all"
        >
          {isOwnerView ? (
            <>
              <UserCheck className="h-3.5 w-3.5" />
              <span>Клиент (PWA)</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Кабинет владельца</span>
            </>
          )}
          <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
        </button>
      </div>
    </div>
  );
};

export default DemoRoleBar;
