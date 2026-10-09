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

  function handleCopyLink() {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Success Badge & Header */}
      <div className="text-center py-6 space-y-2">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2 shadow-inner">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground">
          Запись подтверждена!
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
          Ждем вас в {tenant.name}. Ниже сохранены детали и ваша персональная ссылка на запись.
        </p>
      </div>

      {/* Main Booking Summary Card */}
      <Card className="p-5 border border-border bg-card shadow-lg space-y-4">
        <div className="flex items-start justify-between border-b border-border/80 pb-3">
          <div>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 mb-1">
              {booking.resource_name}
            </Badge>
            <h3 className="text-lg font-bold text-foreground">
              {booking.service_name}
            </h3>
          </div>
          <span className="text-lg font-black text-primary">
            {formatCurrency(booking.price, tenant.currency)}
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
        </div>

        {/* Secret shareable link */}
        <div className="pt-3 border-t border-border/80 space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Ваша персональная ссылка для проверки записи
          </span>
          <div className="flex items-center gap-2">
            <div className="text-xs bg-secondary/80 px-3 py-2 rounded-xl text-muted-foreground font-mono truncate flex-1 border border-border">
              {shareableUrl}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="shrink-0 h-9 px-3 rounded-xl gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs">Скопировано</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  <span className="text-xs">Копировать</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Action Buttons: Calendar & Push */}
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          variant="outline"
          onClick={handleDownloadCalendar}
          className="h-11 rounded-xl text-xs sm:text-sm font-semibold gap-2 border-border bg-secondary/40 hover:bg-secondary"
        >
          <Download className="h-4 w-4 text-primary" />
          <span>В календарь (.ics)</span>
        </Button>

        <Button
          variant="outline"
          disabled={pushStatus === 'granted' || isSubscribing}
          onClick={requestPushPermission}
          className="h-11 rounded-xl text-xs sm:text-sm font-semibold gap-2 border-border bg-secondary/40 hover:bg-secondary"
        >
          <Bell className="h-4 w-4 text-primary" />
          <span>{pushStatus === 'granted' ? 'Push включен' : 'Напомнить (Push)'}</span>
        </Button>
      </div>

      {/* Manage Booking or Done Button */}
      <div className="pt-2 flex flex-col gap-2">
        {onManageBooking && (
          <Button
            variant="secondary"
            onClick={onManageBooking}
            className="w-full h-11 rounded-xl font-semibold"
          >
            Управление записью (перенести / отменить)
          </Button>
        )}

        <Button
          onClick={onDone}
          className="w-full h-12 rounded-xl text-base font-bold shadow-md gap-2"
        >
          <span>К списку услуг</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
