import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';
import { api } from '@/lib/api';
import { StudioHero } from '@/components/client/StudioHero';
import { BookingManagementModal } from '@/components/client/BookingManagementModal';
import { DbBooking } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { downloadIcsFile } from '@/lib/ics';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  MapPin,
  Download,
  AlertTriangle,
  ArrowLeft,
  Settings,
  Car,
} from 'lucide-react';

export const ClientBookingStatusPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const { tenant, isLoading: isTenantLoading } = useTenant();
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const {
    data: booking,
    isLoading: isBookingLoading,
    isError: isBookingError,
    refetch,
  } = useQuery<DbBooking | null>({
    queryKey: ['booking', bookingId, token],
    queryFn: () => (bookingId && token ? api.lookupBooking(bookingId, token) : Promise.resolve(null)),
    enabled: Boolean(bookingId && token),
  });

  if (isTenantLoading || isBookingLoading) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-md mx-auto space-y-4 pt-10">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-10 w-3/4 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!tenant) return null;

  if (!token || isBookingError || !booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-3">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Доступ ограничен</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Для просмотра и управления этой записью требуется персональная ссылка с токеном доступа.
        </p>
        <Button className="mt-5 rounded-xl" onClick={() => (window.location.href = `/s/${tenant.slug}/`)}>
          К услугам студии
        </Button>
      </div>
    );
  }

  const statusVariant =
    booking.status === 'confirmed'
      ? 'default'
      : booking.status === 'checked_in'
      ? 'warning'
      : booking.status === 'completed'
      ? 'success'
      : 'destructive';

  const statusText =
    booking.status === 'confirmed'
      ? 'Подтверждена'
      : booking.status === 'checked_in'
      ? 'Автомобиль в работе'
      : booking.status === 'completed'
      ? 'Заказ выполнен'
      : 'Запись отменена';

  function handleDownloadCalendar() {
    if (!booking || !tenant) return;
    downloadIcsFile({
      id: booking.id,
      title: booking.service_name_snapshot,
      description: `Запись на ${booking.service_name_snapshot} в ${tenant.name}`,
      location: `${tenant.city}, ${tenant.address}`,
      startTime: booking.start_time,
      endTime: booking.end_time,
      businessName: tenant.name,
    });
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <StudioHero tenant={tenant} />

      <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (window.location.href = `/s/${tenant.slug}/`)}
          className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>К списку услуг</span>
        </Button>

        {/* Status Card */}
        <Card className="p-5 border border-border bg-card shadow-lg space-y-4">
          <div className="flex items-start justify-between border-b border-border/80 pb-3">
            <div>
              <Badge variant={statusVariant} className="text-xs mb-1.5 font-bold">
                {statusText}
              </Badge>
              <h2 className="text-xl font-bold text-foreground">
                {booking.service_name_snapshot}
              </h2>
            </div>
            <span className="text-lg font-black text-primary">
              {formatCurrency(booking.price_snapshot, tenant.currency)}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">
                {format(new Date(booking.start_time), 'd MMMM yyyy (EEEE)', { locale: ru })}
              </span>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">
                {format(new Date(booking.start_time), 'HH:mm')} — {format(new Date(booking.end_time), 'HH:mm')}
              </span>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>{tenant.city}, {tenant.address}</span>
            </div>

            {booking.car_model && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Car className="h-4 w-4 text-primary shrink-0" />
                <span>
                  {booking.car_model} {booking.car_plate ? `(${booking.car_plate})` : ''}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Actions: Calendar & Management */}
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="outline"
            onClick={handleDownloadCalendar}
            className="h-11 rounded-xl text-xs sm:text-sm font-semibold gap-2 border-border bg-secondary/40 hover:bg-secondary"
          >
            <Download className="h-4 w-4 text-primary" />
            <span>В календарь</span>
          </Button>

          {booking.status === 'confirmed' && (
            <Button
              variant="outline"
              onClick={() => setIsManageModalOpen(true)}
              className="h-11 rounded-xl text-xs sm:text-sm font-semibold gap-2 border-border bg-secondary/40 hover:bg-secondary"
            >
              <Settings className="h-4 w-4 text-primary" />
              <span>Управление</span>
            </Button>
          )}
        </div>
      </main>

      {/* Reschedule & Cancel Modal */}
      {booking && (
        <BookingManagementModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          booking={booking}
          tenant={tenant}
          accessToken={token}
          onUpdated={() => refetch()}
        />
      )}
    </div>
  );
};
