import React, { useState } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { useServices } from '@/hooks/useServices';
import { StudioHero } from '@/components/client/StudioHero';
import { ServiceCard } from '@/components/client/ServiceCard';
import { BookingDrawer } from '@/components/client/BookingDrawer';
import { BookingReceipt } from '@/components/client/BookingReceipt';
import { DbService, CreateBookingResponse } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sparkles, Calendar, AlertCircle } from 'lucide-react';
import { AIChatWidget } from '@/components/client/AIChatWidget';

export const ClientPortalPage: React.FC = () => {
  const { tenant, isLoading: isTenantLoading, isError: isTenantError } = useTenant();
  const { data: services = [], isLoading: isServicesLoading, isError: isServicesError } = useServices(
    tenant?.id
  );

  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [activeService, setActiveService] = useState<DbService | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<CreateBookingResponse | null>(null);

  if (isTenantLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4 max-w-lg mx-auto">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-10 w-3/4 rounded-lg" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isTenantError || !tenant) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-3">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Студия не найдена</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Запрашиваемый адрес студии не существует или был перемещен.
        </p>
        <Button className="mt-5 rounded-xl" onClick={() => (window.location.href = '/')}>
          На главную
        </Button>
      </div>
    );
  }

  // If a booking was just completed, show the receipt view
  if (completedBooking) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <StudioHero tenant={tenant} />
        <BookingReceipt
          booking={completedBooking}
          tenant={tenant}
          onDone={() => setCompletedBooking(null)}
        />
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
    <div className="min-h-screen bg-background pb-20 selection:bg-primary/20">
      {/* Studio Top Hero */}
      <StudioHero tenant={tenant} />

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {/* Category Pills Strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Каталог услуг ({filteredServices.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              Выберите услугу для записи
            </span>
          </div>

          {isServicesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </div>
          ) : isServicesError ? (
            <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-center text-sm text-destructive">
              Не удалось загрузить список услуг. Пожалуйста, обновите страницу.
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-8 rounded-2xl border border-border bg-card text-center text-sm text-muted-foreground">
              В данной категории пока нет активных услуг.
            </div>
          ) : (
            <div className="grid gap-3.5">
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
        </div>
      </main>

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

      {/* AI Assistant Chat Widget */}
      <AIChatWidget tenant={tenant} />
    </div>
  );
};
