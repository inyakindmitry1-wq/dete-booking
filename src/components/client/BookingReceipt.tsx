import React, { useState } from 'react';
import { format, addMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DbTenant, CreateBookingResponse } from '@/types/database';
import { Button } from '@/components/ui/button';
import { downloadIcsFile } from '@/lib/ics';
import { useWebPush } from '@/hooks/useWebPush';
import { formatCurrency } from '@/lib/utils';
import {
  Check,
  Download,
  Share2,
  Bell,
  ArrowRight,
  User,
  Settings2,
} from 'lucide-react';

interface BookingReceiptProps {
  booking: CreateBookingResponse;
  tenant: DbTenant;
  onDone: () => void;
  onManageBooking?: () => void;
}

export const BookingReceipt: React.FC<BookingReceiptProps> = ({
  booking,
  tenant,
  onDone,
  onManageBooking,
}) => {
  const [copied, setCopied] = useState(false);
  const { status: pushStatus, isSubscribing, requestPushPermission } = useWebPush(tenant);

  const shareableUrl = `${window.location.origin}/s/${tenant.slug}/booking/${booking.booking_id}?token=${booking.access_token}`;

  const startDate = new Date(booking.start_time);
  const formattedStart = format(startDate, "d MMMM 'в' HH:mm", { locale: ru });
  const finishDate = new Date(booking.end_time);
  const formattedFinish = format(finishDate, "d MMMM 'в' HH:mm", { locale: ru });

  const studioShortName = tenant.name.split(' ')[0] || tenant.name;
  const studioAddress = `${tenant.city}, ${tenant.address}`;

  async function handleShareOrCopy() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Запись в ${tenant.name}`,
          text: `Мой талон на ${booking.service_name} в ${tenant.name}`,
          url: shareableUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleDownloadCalendar() {
    downloadIcsFile({
      id: booking.booking_id,
      title: booking.service_name,
      description: `Запись на ${booking.service_name} в ${tenant.name}. Пост: ${booking.resource_name}. Стоимость: ${formatCurrency(booking.price, tenant.currency)}`,
      location: studioAddress,
      startTime: booking.start_time,
      endTime: booking.end_time,
      businessName: tenant.name,
    });
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 space-y-4 animate-in fade-in duration-300">
      {/* Top Header Row (Matching Photo 3: Logo + Name left, User icon right) */}
      <div className="flex items-center justify-between pt-1">
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
      <h1 className="text-2xl font-bold text-white tracking-tight pt-1">
        Моя запись
      </h1>

      {/* ==================================================================== */}
      {/* HERO STATUS CARD (Matching Photo 3 with Dot Grid & Cyan Glow)         */}
      {/* ==================================================================== */}
      <div
        className="relative rounded-3xl border border-white/10 p-5 overflow-hidden shadow-2xl"
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
              Подтверждена
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
      <div className="pt-2 space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {booking.service_name}
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Стоимость</span>
            <span className="font-bold text-white">
              {formatCurrency(booking.price, tenant.currency)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Выдача, ориентир</span>
            <span className="text-white">
              {formattedFinish}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Пост</span>
            <span className="font-medium text-white">
              {booking.resource_name}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Адрес</span>
            <span className="text-white text-right max-w-[220px] truncate">
              {studioAddress}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="outline"
            onClick={handleDownloadCalendar}
            className="h-12 rounded-2xl text-xs font-semibold gap-2 border-white/10 bg-[#131722]/80 hover:bg-[#1c2233] text-white active:scale-[0.98]"
          >
            <Download className="h-4 w-4 text-blue-400" />
            <span>В календарь (.ics)</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleShareOrCopy}
            className="h-12 rounded-2xl text-xs font-semibold gap-2 border-white/10 bg-[#131722]/80 hover:bg-[#1c2233] text-white active:scale-[0.98]"
          >
            <Share2 className="h-4 w-4 text-blue-400" />
            <span>{copied ? 'Скопировано!' : 'Поделиться'}</span>
          </Button>
        </div>

        {/* Push Notification Button */}
        <Button
          variant="outline"
          disabled={pushStatus === 'granted' || isSubscribing}
          onClick={requestPushPermission}
          className="w-full h-11 rounded-2xl text-xs font-semibold gap-2 border-white/10 bg-[#131722]/80 hover:bg-[#1c2233] text-white active:scale-[0.98]"
        >
          <Bell className="h-4 w-4 text-blue-400" />
          <span>{pushStatus === 'granted' ? 'Напоминание включено' : 'Напомнить о записи (Push)'}</span>
        </Button>

        {onManageBooking && (
          <Button
            variant="ghost"
            onClick={onManageBooking}
            className="w-full h-11 rounded-2xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 gap-2"
          >
            <Settings2 className="h-4 w-4" />
            <span>Перенести или отменить запись</span>
          </Button>
        )}

        {/* Return Button */}
        <Button
          onClick={onDone}
          className="w-full h-13 rounded-2xl text-sm font-bold bg-[#2563eb] hover:bg-blue-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)] gap-2 active:scale-[0.98]"
        >
          <span>К списку услуг</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
