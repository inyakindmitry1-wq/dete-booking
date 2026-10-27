import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';
import { api } from '@/lib/api';
import { ClientTopBar } from '@/components/client/ClientTopBar';
import { BookingManagementModal } from '@/components/client/BookingManagementModal';
import { DbBooking } from '@/types/database';
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
  Settings2,
  Car,
  Share2,
  Check,
} from 'lucide-react';

export const ClientBookingStatusPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const { tenant, isLoading: isTenantLoading } = useTenant();
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
      <div className="min-h-screen bg-black/95 flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-background border-x border-white/[0.08] p-4 space-y-4 pt-8">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  if (!token || isBookingError || !booking) {
    return (
      <div className="min-h-screen bg-black/95 flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-background border-x border-white/[0.08] flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-3">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Доступ ограничен</h1>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs">
            Для просмотра и управления этой записью требуется персональный токен доступа.
          </p>
          <Button className="mt-5 rounded-xl h-11 px-5" onClick={() => navigate(`/s/${tenant.slug}/`)}>
            К услугам студии
          </Button>
        </div>
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
      ? 'В работе'
      : booking.status === 'completed'
      ? 'Выполнен'
      : 'Отменена';

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

  async function handleShare() {
    if (!tenant || !booking) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Талон записи в ${tenant.name}`,
          text: `${booking.service_name_snapshot} в ${tenant.name}`,
          url: window.location.href,
        });
        return;
      } catch {
        // user cancelled
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=4&data=${encodeURIComponent(window.location.href)}`;

  return (
    <div className="min-h-screen bg-black/95 flex justify-center antialiased">
      <div className="w-full max-w-md min-h-screen bg-background border-x border-white/[0.08] flex flex-col relative pb-10 shadow-2xl">
        <ClientTopBar tenant={tenant} />

        <main className="px-4 pt-4 space-y-4 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/s/${tenant.slug}/`)}
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>К списку услуг</span>
          </Button>

          {/* Digital Ticket Pass */}
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-card via-card/95 to-secondary/40 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Ticket Header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl overflow-hidden bg-background border border-white/10 shrink-0 p-0.5">
                  <img src={tenant.logo_url} alt={tenant.name} className="h-full w-full object-cover rounded-lg" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                    Талон #{booking.id.slice(0, 8)}
                  </span>
                  <h3 className="text-xs font-bold text-foreground">
                    {tenant.name}
                  </h3>
                </div>
              </div>
              <Badge variant={statusVariant} className="text-[11px] font-bold px-2.5 py-0.5">
                {statusText}
              </Badge>
            </div>

            {/* Perforated divider */}
            <div className="relative flex items-center justify-between px-2 -my-2.5 z-10">
              <div className="h-5 w-5 rounded-full bg-background border-r border-white/10 -ml-4" />
              <div className="flex-1 border-b-2 border-dashed border-white/10 mx-2" />
              <div className="h-5 w-5 rounded-full bg-background border-l border-white/10 -mr-4" />
            </div>

            {/* Ticket Body */}
            <div className="p-5 pt-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs text-muted-foreground block">Услуга</span>
                  <h4 className="text-base font-extrabold text-foreground mt-0.5">
                    {booking.service_name_snapshot}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-muted-foreground block">Стоимость</span>
                  <span className="text-lg font-black text-primary">
                    {formatCurrency(booking.price_snapshot, tenant.currency)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-background/60 border border-white/[0.06] space-y-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>Дата</span>
                  </span>
                  <span className="font-bold text-foreground block text-xs">
                    {format(new Date(booking.start_time), 'd MMMM, EEEE', { locale: ru })}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-background/60 border border-white/[0.06] space-y-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Время</span>
                  </span>
                  <span className="font-bold text-foreground block text-xs">
                    {format(new Date(booking.start_time), 'HH:mm')} — {format(new Date(booking.end_time), 'HH:mm')}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-background/60 border border-white/[0.06] space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{tenant.city}, {tenant.address}</span>
                </div>
                {booking.car_model && (
                  <div className="flex items-center gap-2">
                    <Car className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>
                      {booking.car_model} {booking.car_plate ? `(${booking.car_plate})` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* QR Code Pass */}
              <div className="pt-1 flex flex-col items-center justify-center p-3 rounded-2xl bg-black/40 border border-white/[0.06] text-center space-y-2">
                <div className="h-24 w-24 p-1.5 bg-white rounded-xl shadow-md overflow-hidden">
                  <img src={qrImageUrl} alt="QR талон" className="h-full w-full object-contain" />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Покажите этот QR-код мастеру при заезде
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              onClick={handleDownloadCalendar}
              className="h-11 rounded-xl text-xs font-semibold gap-2 border-white/10 bg-secondary/50 hover:bg-secondary active:scale-[0.98]"
            >
              <Download className="h-4 w-4 text-primary" />
              <span>В календарь</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleShare}
              className="h-11 rounded-xl text-xs font-semibold gap-2 border-white/10 bg-secondary/50 hover:bg-secondary active:scale-[0.98]"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4 text-primary" />}
              <span>{copied ? 'Скопировано' : 'Поделиться'}</span>
            </Button>
          </div>

          {booking.status === 'confirmed' && (
            <Button
              variant="secondary"
              onClick={() => setIsManageModalOpen(true)}
              className="w-full h-11 rounded-xl text-xs font-bold gap-2 border border-white/10 active:scale-[0.98]"
            >
              <Settings2 className="h-4 w-4" />
              <span>Перенести или отменить запись</span>
            </Button>
          )}
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
    </div>
  );
};
