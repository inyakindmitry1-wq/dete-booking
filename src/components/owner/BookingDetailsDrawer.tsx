import React, { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DbBooking, DbTenant, PaymentMethod } from '@/types/database';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Phone,
  Car,
  User,
  Clock,
  CheckCircle,
  CreditCard,
  Banknote,
  Send,
  Loader2,
  XCircle,
} from 'lucide-react';

interface BookingDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: DbBooking | null;
  tenant: DbTenant;
  onUpdated: () => void;
}

export const BookingDetailsDrawer: React.FC<BookingDetailsDrawerProps> = ({
  isOpen,
  onClose,
  booking,
  tenant,
  onUpdated,
}) => {
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (!booking) return null;

  async function handleStatusChange(status: DbBooking['status']) {
    if (!booking) return;
    setIsUpdating(true);
    try {
      await api.updateBookingStatus(booking.id, status);
      onUpdated();
      onClose();
    } catch (e) {
      console.error('Update status error:', e);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRecordPayment() {
    if (!booking) return;
    const amount = parseFloat(paymentAmount) || booking.price_snapshot;

    setIsUpdating(true);
    try {
      await api.recordPayment({
        tenant_id: tenant.id,
        booking_id: booking.id,
        amount,
        payment_method: paymentMethod,
        note: paymentNote || undefined,
      });
      // Also automatically mark completed if paid
      await api.updateBookingStatus(booking.id, 'completed');
      onUpdated();
      onClose();
    } catch (e) {
      console.error('Record payment error:', e);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-md mx-auto">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>Детали заказа</DrawerTitle>
              <DrawerDescription>
                Заказ #{booking.id.slice(-6)}
              </DrawerDescription>
            </div>
            <span className="text-lg font-black text-primary">
              {formatCurrency(booking.price_snapshot, tenant.currency)}
            </span>
          </div>
        </DrawerHeader>

        <div className="space-y-4">
          {/* Customer and Car info */}
          <div className="p-3.5 rounded-xl border border-border bg-secondary/50 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Услуга:</span>
              <span className="font-bold text-foreground">{booking.service_name_snapshot}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Время:</span>
              <span className="font-semibold text-foreground">
                {format(new Date(booking.start_time), 'd MMM, HH:mm', { locale: ru })} —{' '}
                {format(new Date(booking.end_time), 'HH:mm')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Клиент:</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {booking.customer?.name}
              </span>
            </div>

            {booking.customer?.phone && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Телефон:</span>
                <a
                  href={`tel:${booking.customer.phone}`}
                  className="font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {booking.customer.phone}
                </a>
              </div>
            )}

            {booking.car_model && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Автомобиль:</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Car className="h-3 w-3 text-primary" />
                  {booking.car_model} {booking.car_plate ? `(${booking.car_plate})` : ''}
                </span>
              </div>
            )}

            {booking.customer_notes && (
              <div className="pt-1.5 border-t border-border/60">
                <span className="text-muted-foreground block mb-0.5">Комментарий клиента:</span>
                <span className="text-foreground italic">{booking.customer_notes}</span>
              </div>
            )}
          </div>

          {/* Payment Section */}
          {!showPaymentForm ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {booking.status === 'confirmed' && (
                  <Button
                    variant="outline"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('checked_in')}
                    className="h-11 rounded-xl text-xs font-semibold gap-1.5 text-amber-400 border-amber-500/30 bg-amber-500/10"
                  >
                    <span>Принять в работу</span>
                  </Button>
                )}

                <Button
                  onClick={() => {
                    setPaymentAmount(String(booking.price_snapshot));
                    setShowPaymentForm(true);
                  }}
                  className="h-11 rounded-xl text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Banknote className="h-4 w-4" />
                  <span>Оплатить и закрыть</span>
                </Button>
              </div>

              {booking.status !== 'cancelled' && (
                <Button
                  variant="ghost"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange('cancelled')}
                  className="w-full text-xs text-destructive hover:bg-destructive/10 h-9 rounded-xl"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  <span>Отменить запись</span>
                </Button>
              )}
            </div>
          ) : (
            /* Payment Input Form */
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <span className="text-xs font-bold text-emerald-400 block">
                Прием оплаты
              </span>

              <div>
                <Label htmlFor="pay-amt" className="text-xs">Сумма к получению (₽)</Label>
                <Input
                  id="pay-amt"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="h-10 mt-1 font-bold text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs block mb-1.5">Способ оплаты</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['card', 'cash', 'transfer'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`h-9 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        paymentMethod === m
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'border-border bg-secondary/50 text-muted-foreground'
                      }`}
                    >
                      {m === 'card' ? 'Карта' : m === 'cash' ? 'Наличные' : 'Перевод'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 rounded-xl"
                >
                  Отмена
                </Button>
                <Button
                  size="sm"
                  disabled={isUpdating}
                  onClick={handleRecordPayment}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Подтвердить чек'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter />
      </DrawerContent>
    </Drawer>
  );
};
