import React, { useState, useEffect } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { useServices } from '@/hooks/useServices';
import { StudioHero } from '@/components/client/StudioHero';
import { ServiceCard } from '@/components/client/ServiceCard';
import { BookingDrawer } from '@/components/client/BookingDrawer';
import { BookingReceipt } from '@/components/client/BookingReceipt';
import { ClientTopBar } from '@/components/client/ClientTopBar';
import { ClientBottomNav, ClientTab } from '@/components/client/ClientBottomNav';
import { StudioInfoView } from '@/components/client/StudioInfoView';
import { MyBookingsView } from '@/components/client/MyBookingsView';
import { AIChatWidget } from '@/components/client/AIChatWidget';
import { DbService, CreateBookingResponse } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle, Sparkles } from 'lucide-react';

export const ClientPortalPage: React.FC = () => {
  const { tenant, isLoading: isTenantLoading, isError: isTenantError } = useTenant();
  const { data: services = [], isLoading: isServicesLoading, isError: isServicesError } = useServices(
    tenant?.id
  );

  const [activeTab, setActiveTab] = useState<ClientTab>('catalog');
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

  if (isTenantLoading) {
    return (
      <div className="min-h-screen bg-black/95 flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-background border-x border-white/[0.08] p-4 space-y-4">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isTenantError || !tenant) {
    return (
      <div className="min-h-screen bg-black/95 flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-background border-x border-white/[0.08] flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-3">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Студия не найдена</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Запрашиваемый адрес студии не существует или был перемещен.
          </p>
          <Button className="mt-5 rounded-xl h-11 px-5" onClick={() => (window.location.href = '/')}>
            На главную
          </Button>
        </div>
      </div>
    );
  }

  // If a booking was just completed, show the receipt view
  if (completedBooking) {
    return (
      <div className="min-h-screen bg-black/95 flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-background border-x border-white/[0.08] flex flex-col relative pb-8 shadow-2xl">
          <ClientTopBar tenant={tenant} />
          <BookingReceipt
            booking={completedBooking}
            tenant={tenant}
            onDone={() => {
              setCompletedBooking(null);
              setActiveTab('catalog');
            }}
          />
        </div>
      </div>
    );
  }

  // Categories list
  const categories = ['Все', ...Array.from(new Set(services.map((s) => s.category)))];
  const filteredServices =
    selectedCategory === 'Все'
      ? services
      : services.filter((s) => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black/95 flex justify-center antialiased selection:bg-primary/20">
      {/* Centered Mobile App Shell Frame */}
      <div className="w-full max-w-md min-h-screen bg-background border-x border-white/[0.08] flex flex-col relative pb-20 shadow-2xl">
        {/* Top Native App Bar */}
        <ClientTopBar tenant={tenant} />

        {/* Tab 1: Catalog */}
        {activeTab === 'catalog' && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-200">
            {/* Studio Hero Profile */}
            <StudioHero tenant={tenant} />

            {/* Services Content Container */}
            <main className="px-3.5 pt-4 space-y-4 flex-1">
              {/* Category Pills Filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95 select-none",
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground border border-white/[0.06]"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Services List Header */}
              <div className="flex items-center justify-between pt-1">
                <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">
                  Услуги ({filteredServices.length})
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  Выберите для записи
                </span>
              </div>

              {/* Services List Grid */}
              {isServicesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-28 w-full rounded-2xl" />
                  <Skeleton className="h-28 w-full rounded-2xl" />
                  <Skeleton className="h-28 w-full rounded-2xl" />
                </div>
              ) : isServicesError ? (
                <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-center text-xs text-destructive">
                  Не удалось загрузить список услуг. Пожалуйста, обновите страницу.
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="p-8 rounded-2xl border border-white/[0.06] bg-card/60 text-center text-xs text-muted-foreground">
                  В данной категории пока нет активных услуг.
                </div>
              ) : (
                <div className="space-y-2.5 pb-4">
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
          </div>
        )}

        {/* Tab 2: AI Concierge */}
        {activeTab === 'ai' && (
          <div className="flex-1 p-4 flex flex-col justify-center items-center text-center space-y-4 animate-in fade-in duration-200">
            <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-lg shadow-primary/5">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                AI-Консультант {tenant.name}
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Ответит на вопросы по ценам, регламентам ухода и поможет подобрать подходящую услугу.
              </p>
            </div>
            <Button
              onClick={() => {
                const trigger = document.getElementById('ai-floating-trigger');
                if (trigger) trigger.click();
              }}
              className="h-11 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Открыть диалог</span>
            </Button>
          </div>
        )}

        {/* Tab 3: Saved Tickets / Passes */}
        {activeTab === 'ticket' && (
          <main className="px-4 pt-5 flex-1 animate-in fade-in duration-200">
            <MyBookingsView
              tenant={tenant}
              onBookNew={() => setActiveTab('catalog')}
            />
          </main>
        )}

        {/* Tab 4: Studio Info & Location */}
        {activeTab === 'info' && (
          <main className="px-4 pt-5 flex-1 animate-in fade-in duration-200">
            <StudioInfoView tenant={tenant} />
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

        {/* Fixed Mobile Bottom Tab Bar */}
        <ClientBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasActiveBooking={hasRecentBooking}
        />
      </div>
    </div>
  );
};
