import React, { useState, useEffect } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { useServices } from '@/hooks/useServices';
import { ServiceCard } from './ServiceCard';
import { AIBanner } from './AIBanner';
import { BottomNav, ClientTab } from './BottomNav';
import { BookingDrawer } from './BookingDrawer';
import { BookingReceipt } from './BookingReceipt';
import { StudioInfoView } from './StudioInfoView';
import { MyBookingsView } from './MyBookingsView';
import { AIChatWidget } from './AIChatWidget';
import { DbService, CreateBookingResponse } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Wrench,
  Warehouse,
  Tag,
  ArrowUpRight,
  User,
  AlertCircle,
  Layers,
} from 'lucide-react';

export const Home: React.FC = () => {
  const { tenant, isLoading: isTenantLoading, isError: isTenantError } = useTenant();
  const { data: services = [], isLoading: isServicesLoading, isError: isServicesError } = useServices(
    tenant?.id
  );

  const [activeTab, setActiveTab] = useState<ClientTab>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [activeService, setActiveService] = useState<DbService | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<CreateBookingResponse | null>(null);
  const [hasRecentBooking, setHasRecentBooking] = useState(false);

  useEffect(() => {
    if (tenant) {
      try {
        const stored = localStorage.getItem(`recent_bookings_${tenant.slug}`);
        if (stored && JSON.parse(stored).length > 0) {
          setHasRecentBooking(true);
        }
      } catch {
        // ignore
      }
    }
  }, [tenant, completedBooking]);

  function handleOpenAI() {
    const trigger = document.getElementById('ai-floating-trigger');
    if (trigger) {
      trigger.click();
    }
  }

  function handleQuickBookHero() {
    if (services.length > 0) {
      setActiveService(services[0]);
      setIsDrawerOpen(true);
    }
  }

  if (isTenantLoading) {
    return (
      <div className="min-h-screen bg-black flex justify-center antialiased">
        <div className="w-full max-w-md min-h-screen bg-black border-x border-white/[0.08] p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-900" />
          <Skeleton className="h-56 w-full rounded-3xl bg-zinc-900" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 w-full rounded-2xl bg-zinc-900" />
            <Skeleton className="h-20 w-full rounded-2xl bg-zinc-900" />
          </div>
          <Skeleton className="h-14 w-full rounded-2xl bg-zinc-900" />
          <Skeleton className="h-28 w-full rounded-2xl bg-zinc-900" />
        </div>
      </div>
    );
  }

  if (isTenantError || !tenant) {
    return (
      <div className="min-h-screen bg-black flex justify-center antialiased">
        <div className="w-full max-w-md min-h-screen bg-black border-x border-white/[0.08] flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-3 ring-1 ring-destructive/20">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h1 className="text-xl font-bold text-white">Студия не найдена</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            Запрашиваемый адрес студии не существует или был перемещен.
          </p>
          <Button className="mt-5 rounded-xl h-11 px-5" onClick={() => (window.location.href = '/')}>
            На главную
          </Button>
        </div>
      </div>
    );
  }

  // If a booking was just completed, show the receipt ticket
  if (completedBooking) {
    return (
      <div className="min-h-screen bg-black flex justify-center antialiased selection:bg-primary/20">
        <div className="w-full max-w-md min-h-screen bg-black border-x border-white/[0.08] flex flex-col relative pb-8 shadow-2xl">
          <BookingReceipt
            booking={completedBooking}
            tenant={tenant}
            onDone={() => {
              setCompletedBooking(null);
              setActiveTab('home');
            }}
          />
        </div>
      </div>
    );
  }

  const minPrice = services.length > 0 ? Math.min(...services.map((s) => s.price)) : 3500;
  const categories = ['Все', ...Array.from(new Set(services.map((s) => s.category)))];
  const filteredServices =
    selectedCategory === 'Все'
      ? services
      : services.filter((s) => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black flex justify-center antialiased selection:bg-primary/20">
      {/* Centered Mobile App Shell Frame */}
      <div className="w-full max-w-md min-h-screen bg-black border-x border-white/[0.08] flex flex-col relative pb-24 shadow-[0_0_80px_rgba(0,0,0,0.95)]">
        
        {/* Top App Header (Brand Logo + Profile Button) */}
        <header className="pt-[calc(env(safe-area-inset-top,8px)+6px)] px-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Multi-layer styling brand mark icon */}
            <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-white shadow-inner">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-sm font-black uppercase tracking-wider text-white">
              {tenant.name.split(' ')[0] || 'SGX'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => (window.location.href = `/s/${tenant.slug}/owner/`)}
            aria-label="Вход для владельца"
            className="h-9 w-9 rounded-full border border-white/15 bg-zinc-900/80 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white/30 active:scale-95 transition-all"
          >
            <User className="h-4 w-4" />
          </button>
        </header>

        {/* Tab 1: Home View (Flagship Screen from Reference) */}
        {activeTab === 'home' && (
          <main className="px-4 space-y-5 flex-1 animate-in fade-in duration-200">
            {/* 1. Hero Car Spotlight Card */}
            <div className="relative rounded-[28px] border border-white/[0.08] bg-[#0c0f15] overflow-hidden shadow-2xl">
              {/* Electric Neon Accent Halo Ring */}
              <div className="absolute top-2 inset-x-0 mx-auto h-32 w-64 rounded-full border-[6px] border-primary/50 blur-[2px] opacity-80 pointer-events-none" />
              <div className="absolute top-4 inset-x-0 mx-auto h-28 w-56 rounded-full bg-primary/20 blur-xl pointer-events-none" />

              {/* Sports Car Frontal Render */}
              <div className="relative h-48 sm:h-52 w-full flex items-center justify-center overflow-hidden">
                <img
                  src={tenant.cover_url}
                  alt={tenant.name}
                  className="h-full w-full object-cover object-center scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f15] via-transparent to-black/20" />

                {/* Floating Glass Booking Button inside Car Card */}
                <div className="absolute bottom-3 inset-x-3">
                  <button
                    type="button"
                    onClick={handleQuickBookHero}
                    className="w-full h-12 px-5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center justify-between text-white hover:bg-black/75 active:scale-[0.98] transition-all shadow-lg"
                  >
                    <span className="text-sm font-bold tracking-tight">Записаться</span>
                    <ArrowUpRight className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Studio Title & Description */}
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {tenant.name}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {tenant.tagline}
              </p>
            </div>

            {/* 3. Metrics & Info Cards (3 Badges) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Card 1: Services count */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#121316] p-3.5 shadow-sm space-y-0.5">
                <div className="flex items-center gap-2 text-white font-black text-lg">
                  <Wrench className="h-4 w-4 text-white shrink-0" />
                  <span>{services.length || 4}</span>
                </div>
                <span className="text-xs text-zinc-400 block font-medium">
                  услуг в прайсе
                </span>
              </div>

              {/* Card 2: Bays count */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#121316] p-3.5 shadow-sm space-y-0.5">
                <div className="flex items-center gap-2 text-white font-black text-lg">
                  <Warehouse className="h-4 w-4 text-white shrink-0" />
                  <span>3</span>
                </div>
                <span className="text-xs text-zinc-400 block font-medium">
                  бокса в работе
                </span>
              </div>

              {/* Card 3: Starting price */}
              <div className="col-span-2 rounded-2xl border border-white/[0.07] bg-[#121316] p-3.5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-black text-base">
                  <Tag className="h-4 w-4 text-white shrink-0" />
                  <span>от {formatCurrency(minPrice, tenant.currency)}</span>
                </div>
                <span className="text-xs text-zinc-400 font-medium">
                  за услугу
                </span>
              </div>
            </div>

            {/* 4. Section: Запись в студию (AI Banner) */}
            <div className="space-y-2.5 pt-1">
              <h2 className="text-xl font-black text-white tracking-tight">
                Запись в студию
              </h2>
              <AIBanner tenant={tenant} onOpenAI={handleOpenAI} />
            </div>

            {/* 5. Featured Services Catalog Quick View */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                  Популярные услуги ({services.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Все услуги
                </button>
              </div>

              {isServicesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-28 w-full rounded-2xl bg-zinc-900" />
                  <Skeleton className="h-28 w-full rounded-2xl bg-zinc-900" />
                </div>
              ) : (
                <div className="space-y-2.5">
                  {services.slice(0, 3).map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      currency={tenant.currency}
                      onSelect={(s) => {
                        setActiveService(s);
                        setIsDrawerOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        )}

        {/* Tab 2: Full Services Catalog View */}
        {activeTab === 'catalog' && (
          <main className="px-4 pt-2 space-y-4 flex-1 animate-in fade-in duration-200">
            <h2 className="text-xl font-black text-white tracking-tight">
              Каталог услуг ({filteredServices.length})
            </h2>

            {/* Category Pills Strip */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95 select-none",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06]"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {isServicesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full rounded-2xl bg-zinc-900" />
                <Skeleton className="h-28 w-full rounded-2xl bg-zinc-900" />
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="p-8 rounded-2xl border border-white/[0.06] bg-zinc-900/40 text-center text-xs text-zinc-400">
                В данной категории пока нет активных услуг.
              </div>
            ) : (
              <div className="space-y-2.5 pb-2">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    currency={tenant.currency}
                    onSelect={(s) => {
                      setActiveService(s);
                      setIsDrawerOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </main>
        )}

        {/* Tab 3: Saved Tickets / Passes */}
        {activeTab === 'ticket' && (
          <main className="px-4 pt-2 flex-1 animate-in fade-in duration-200">
            <h2 className="text-xl font-black text-white tracking-tight mb-3">
              Мои записи
            </h2>
            <MyBookingsView
              tenant={tenant}
              onBookNew={() => setActiveTab('catalog')}
            />
          </main>
        )}

        {/* Multi-step Booking Bottom Sheet Drawer */}
        <BookingDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          service={activeService}
          tenant={tenant}
          onBookingComplete={(res) => {
            setIsDrawerOpen(false);
            setCompletedBooking(res);
          }}
        />

        {/* Floating AI Assistant Trigger & Sheet */}
        <AIChatWidget tenant={tenant} />

        {/* Floating Dock Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasActiveBooking={hasRecentBooking}
        />
      </div>
    </div>
  );
};
