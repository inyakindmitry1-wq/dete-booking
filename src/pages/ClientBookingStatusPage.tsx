import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';
import { api } from '@/lib/api';
import { BookingManagementModal } from '@/components/client/BookingManagementModal';
import { DbBooking } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { downloadIcsFile } from '@/lib/ics';
import { formatCurrency } from '@/lib/utils';
import { format, addMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  MapPin,
  Download,
  AlertTriangle,
  ArrowLeft,
  Settings2,
  Share2,
  Check,
  User,
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
      <div className="min-h-screen bg-black flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-black border-x border-white/[0.08] p-4 space-y-4 pt-8">
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-900" />
          <Skeleton className="h-56 w-full rounded-3xl bg-zinc-900" />
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  if (!token || isBookingError || !booking) {
    return (
      <div className="min-h-screen bg-black flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-black border-x border-white/[0.08] flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-3 ring-1 ring-destructive/20">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h1 className="text-xl font-bold text-white">Доступ ограничен</h1>
          <p className="text-xs text-zinc-400 mt-2 max-w-xs">
            Для просмотра и управления этой записью требуется персональный токен доступа.
          </p>
          <Button
            className="mt-5 rounded-2xl h-12 px-6 font-bold bg-[#2563eb] hover:bg-blue-500 text-white"
            onClick={() => navigate(`/s/${tenant.slug}/`)}
          >
            К услугам студии
          </Button>
        </div>
      </div>
    );
  }

  const startDate = new Date(booking.start_time);
  const formattedStart = format(startDate, "d MMMM 'в' HH:mm", { locale: ru });
  const finishDate = new Date(booking.end_time);
  const formattedFinish = format(finishDate, "d MMMM 'в' HH:mm", { locale: ru });

  const statusTitle =
    booking.status === 'confirmed'
      ? 'Подтверждена'
      : booking.status === 'checked_in'
      ? 'В работе'
      : booking.status === 'completed'
      ? 'Выполнен'
      : 'Отменена';

  const studioShortName = tenant.slug === 'graphite' ? 'SGX' : (tenant.name.split(' ')[0] || 'SGX');
  const studioAddress = `${tenant.city}, ${tenant.address}`;

  function handleDownloadCalendar() {
    if (!booking || !tenant) return;
    downloadIcsFile({
      id: booking.id,
      title: booking.service_name_snapshot,
      description: `Запись на ${booking.service_name_snapshot} в ${tenant.name}`,
      location: studioAddress,
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
          title: `Запись в ${tenant.name}`,
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

  return (
    <div className="min-h-screen bg-black flex justify-center antialiased">
      <div className="w-full max-w-md min-h-screen bg-black border-x border-white/[0.08] flex flex-col relative px-4 pb-12 shadow-2xl">
        {/* Back Link */}
        <div className="pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/s/${tenant.slug}/`)}
            className="text-xs text-zinc-400 hover:text-white h-8 px-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>К услугам студии</span>
          </Button>
        </div>

        {/* Top Header Row (Matching Photo 3: Logo + Name left, User icon right) */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg overflow-hidden bg-black/50 border border-white/10 shrink-0 flex items-center justify-center">
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} className="h-full w-full object-cover" />
              ) : (
                <div className="font-black text-xs text-white">S</div>
              )}
            </div>
            <span className="text-sm font-bold text-white tracking-wider">
              {studioShortName}
            </span>
          </div>

          <div className="h-8 w-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-zinc-300">
            <User className="h-4 w-4" />
          </div>
        </div>

        {/* Main Page Title (Matching Photo 3: "Моя запись") */}
        <h1 className="text-2xl font-bold text-white tracking-tight pt-3">
          Моя запись
        </h1>

        {/* ==================================================================== */}
        {/* HERO STATUS CARD (Matching Photo 3 with Dot Grid & Cyan Glow)         */}
        {/* ==================================================================== */}
        <div
          className="relative rounded-3xl border border-white/10 p-5 mt-4 overflow-hidden shadow-2xl"
          style={{
            backgroundColor: '#0a0d14',
            backgroundImage: `
              radial-gradient(circle at 85% 75%, rgba(59, 130, 246, 0.45) 0%, transparent 60%),
              radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: 'auto, 14px 14px',
          }}
        >
          <div className="relative z-10 space-y-3">
            {/* Blue Circle with Checkmark Icon */}
            <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white shadow-[0_0_14px_rgba(37,99,235,0.55)]">
              <Check className="h-4 w-4 stroke-[3]" />
            </div>

            <div>
              <span className="text-xs text-zinc-400 font-medium block">
                {studioShortName}
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                {statusTitle}
              </h3>
              <p className="text-sm text-zinc-300 font-medium mt-1">
                {formattedStart}
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* ORDER DETAILS SECTION (Matching Photo 3 Typography & Hierarchy)       */}
        {/* ==================================================================== */}
        <div className="pt-4 space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {booking.service_name_snapshot}
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Стоимость</span>
              <span className="font-bold text-white">
                {formatCurrency(booking.price_snapshot, tenant.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Выдача, ориентир</span>
              <span className="text-white">
                {formattedFinish}
              </span>
            </div>

            {booking.car_model && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Автомобиль</span>
                <span className="font-medium text-white">
                  {booking.car_model} {booking.car_plate ? `(${booking.car_plate})` : ''}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Адрес</span>
              <span className="text-white text-right max-w-[220px] truncate">
                {studioAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              onClick={handleDownloadCalendar}
              className="h-12 rounded-2xl text-xs font-semibold gap-2 border-white/10 bg-[#131722]/80 hover:bg-[#1c2233] text-white active:scale-[0.98]"
            >
              <Download className="h-4 w-4 text-blue-400" />
              <span>В календарь</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleShare}
              className="h-12 rounded-2xl text-xs font-semibold gap-2 border-white/10 bg-[#131722]/80 hover:bg-[#1c2233] text-white active:scale-[0.98]"
            >
              <Share2 className="h-4 w-4 text-blue-400" />
              <span>{copied ? 'Скопировано!' : 'Поделиться'}</span>
            </Button>
          </div>

          {booking.status === 'confirmed' && (
            <Button
              variant="ghost"
              onClick={() => setIsManageModalOpen(true)}
              className="w-full h-11 rounded-2xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 gap-2"
            >
              <Settings2 className="h-4 w-4" />
              <span>Перенести или отменить запись</span>
            </Button>
          )}
        </div>

        {/* Reschedule & Cancel Modal */}
        <BookingManagementModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          booking={booking}
          tenant={tenant}
          accessToken={token}
          onUpdated={() => refetch()}
        />
      </div>
    </div>
  );
};
