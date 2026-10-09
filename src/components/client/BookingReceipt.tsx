import React, { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DbTenant, CreateBookingResponse } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { downloadIcsFile } from '@/lib/ics';
import { useWebPush } from '@/hooks/useWebPush';
import { formatCurrency } from '@/lib/utils';
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Share2,
  Download,
  Bell,
  ArrowRight,
  Check,
  QrCode,
  ShieldCheck,
  Car,
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
  const { status: pushStatus, isSubscribing, requestPushPermission } = useWebPush();

  const shareableUrl = `${window.location.origin}/s/${tenant.slug}/booking/${booking.booking_id}?token=${booking.access_token}`;

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
        // Fallback to clipboard if user dismissed or aborted
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function handleDownloadCalendar() {
    downloadIcsFile({
      id: booking.booking_id,
      title: booking.service_name,
      description: `Запись на ${booking.service_name} в ${tenant.name}. Пост: ${booking.resource_name}. Стоимость: ${formatCurrency(booking.price, tenant.currency)}`,
      location: `${tenant.city}, ${tenant.address}`,
      startTime: booking.start_time,
      endTime: booking.end_time,
      businessName: tenant.name,
    });
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=4&data=${encodeURIComponent(shareableUrl)}`;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 space-y-5 animate-in fade-in duration-300">
      {/* Header Badge */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1 shadow-lg shadow-emerald-500/5">
          <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground">
          Запись подтверждена!
        </h2>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Ждем вас в <span className="font-semibold text-foreground">{tenant.name}</span>. Ваш электронный талон готов.
        </p>
      </div>

      {/* Apple Wallet / Boarding Pass Digital Ticket */}
      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-card via-card/95 to-secondary/40 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Ticket Header */}
        <div className="p-5 pb-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-background border border-white/10 shrink-0 p-0.5">
              <img src={tenant.logo_url} alt={tenant.name} className="h-full w-full object-cover rounded-lg" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                Электронный талон
              </span>
              <h3 className="text-sm font-bold text-foreground line-clamp-1">
                {tenant.name}
              </h3>
            </div>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold px-2.5 py-0.5">
            Подтверждено
          </Badge>
        </div>

        {/* Perforated divider visual */}
        <div className="relative flex items-center justify-between px-2 -my-2.5 z-10">
          <div className="h-5 w-5 rounded-full bg-background border-r border-white/10 -ml-4" />
          <div className="flex-1 border-b-2 border-dashed border-white/10 mx-2" />
          <div className="h-5 w-5 rounded-full bg-background border-l border-white/10 -mr-4" />
        </div>

        {/* Ticket Details */}
        <div className="p-5 pt-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs text-muted-foreground block">Выбранная услуга</span>
              <h4 className="text-base font-extrabold text-foreground mt-0.5">
                {booking.service_name}
              </h4>
              <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20 mt-1.5 font-medium">
                {booking.resource_name}
              </Badge>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-muted-foreground block">К оплате</span>
              <span className="text-lg font-black text-primary">
                {formatCurrency(booking.price, tenant.currency)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-2.5 rounded-xl bg-background/60 border border-white/[0.06] space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Дата визита</span>
              </span>
              <span className="font-bold text-foreground block text-xs">
                {format(new Date(booking.start_time), 'd MMMM, EEEE', { locale: ru })}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-background/60 border border-white/[0.06] space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Время слота</span>
              </span>
              <span className="font-bold text-foreground block text-xs">
                {format(new Date(booking.start_time), 'HH:mm')} — {format(new Date(booking.end_time), 'HH:mm')}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-background/60 border border-white/[0.06] flex items-center gap-2.5 text-xs text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{tenant.city}, {tenant.address}</span>
          </div>

          {/* QR Code Pass for arrival */}
          <div className="pt-2 flex flex-col items-center justify-center p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-center space-y-2">
            <div className="h-28 w-28 p-1.5 bg-white rounded-xl shadow-md overflow-hidden">
              <img src={qrImageUrl} alt="QR талон" className="h-full w-full object-contain" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-foreground block">
                QR-код для бесконтактного заезда
              </span>
              <span className="text-[10px] text-muted-foreground">
                Покажите администратору или мастеру при заезде
              </span>
            </div>
          </div>

          {/* Shareable Link Action - Sleek Button without raw link text */}
          <div className="pt-2 border-t border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Ваша персональная ссылка для проверки записи
              </span>
              {copied && (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                  <Check className="h-3.5 w-3.5" />
                  <span>Скопировано</span>
                </span>
              )}
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleShareOrCopy}
              className="w-full h-11 rounded-xl text-xs font-bold gap-2 border border-white/10 active:scale-[0.98] transition-transform"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Ссылка скопирована в буфер</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 text-primary" />
                  <span>Поделиться талоном записи</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Action Buttons: Calendar & Push */}
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          variant="outline"
          onClick={handleDownloadCalendar}
          className="h-11 rounded-xl text-xs font-semibold gap-2 border-white/10 bg-secondary/50 hover:bg-secondary active:scale-[0.98]"
        >
          <Download className="h-4 w-4 text-primary" />
          <span>В календарь (.ics)</span>
        </Button>

        <Button
          variant="outline"
          disabled={pushStatus === 'granted' || isSubscribing}
          onClick={requestPushPermission}
          className="h-11 rounded-xl text-xs font-semibold gap-2 border-white/10 bg-secondary/50 hover:bg-secondary active:scale-[0.98]"
        >
          <Bell className="h-4 w-4 text-primary" />
          <span>{pushStatus === 'granted' ? 'Push включен' : 'Напомнить (Push)'}</span>
        </Button>
      </div>

      {/* Manage Booking or Done Button */}
      <div className="space-y-2 pt-1">
        {onManageBooking && (
          <Button
            variant="ghost"
            onClick={onManageBooking}
            className="w-full h-10 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5"
          >
            <Settings2 className="h-4 w-4" />
            <span>Перенести или отменить запись</span>
          </Button>
        )}

        <Button
          onClick={onDone}
          className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 gap-2 active:scale-[0.98]"
        >
          <span>К списку услуг</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
