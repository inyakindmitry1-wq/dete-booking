import React, { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DbBooking, DbTenant, PaymentMethod } from '@/types/database';
import {
  Drawer,
  DrawerContent,
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
  Banknote,
  Loader2,
  XCircle,
  X,
  ArrowRight,
  RotateCcw,
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
      });
      // Automatically mark completed if payment is recorded
      await api.updateBookingStatus(booking.id, 'completed');
      onUpdated();
      onClose();
    } catch (e) {
      console.error('Record payment error:', e);
    } finally {
      setIsUpdating(false);
    }
  }

  const startTime = format(new Date(booking.start_time), 'd MMMM, HH:mm', { locale: ru });
  const endTime = format(new Date(booking.end_time), 'HH:mm');

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-md mx-auto bg-[#0b0e14] border-t border-white/10 text-white rounded-t-[28px] focus:outline-none">
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20 shrink-0" />

        <div className="px-5 pt-3 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
                Детали заказа
              </h2>
              <span className="text-xs text-zinc-400 block mt-0.5">
                #{booking.id.slice(0, 8)} • {booking.service_name_snapshot}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Info Card */}
          <div className="p-4 rounded-2xl border border-white/10 bg-[#131722] space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Стоимость</span>
              <span className="text-base font-extrabold text-white">
                {formatCurrency(booking.price_snapshot, tenant.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Время визита</span>
              <span className="font-semibold text-white">
                {startTime} — {endTime}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Клиент</span>
              <span className="font-semibold text-white flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-400" />
                {booking.customer?.name || 'Клиент'}
              </span>
            </div>

            {booking.customer?.phone && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Телефон</span>
                <a
                  href={`tel:${booking.customer.phone}`}
                  className="font-bold text-blue-400 flex items-center gap-1.5 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {booking.customer.phone}
                </a>
              </div>
            )}

            {booking.car_model && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Автомобиль</span>
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5 text-blue-400" />
                  {booking.car_model} {booking.car_plate ? `(${booking.car_plate})` : ''}
                </span>
              </div>
            )}

            {booking.customer_notes && (
              <div className="pt-2 border-t border-white/[0.08]">
                <span className="text-zinc-400 block mb-0.5">Пожелания клиента:</span>
                <span className="text-zinc-200 italic">{booking.customer_notes}</span>
              </div>
            )}
          </div>

          {/* Action Buttons Matching Reference */}
          {!showPaymentForm ? (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2">
                {booking.status === 'confirmed' ? (
                  <Button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('checked_in')}
                    className="h-12 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-sm"
                  >
                    Автомобиль в работе
                  </Button>
                ) : booking.status === 'checked_in' ? (
                  <Button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('completed')}
                    className="h-12 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                  >
                    Завершить заказ
                  </Button>
                ) : (
                  <Button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('checked_in')}
                    className="h-12 rounded-2xl text-xs font-bold bg-[#131722] hover:bg-[#1c2233] text-zinc-300 border border-white/10"
                  >
                    Вернуть в работу
                  </Button>
                )}

                <Button
                  onClick={() => {
                    setPaymentAmount(String(booking.price_snapshot));
                    setShowPaymentForm(true);
                  }}
                  className="h-12 rounded-2xl text-xs font-bold bg-[#2563eb] hover:bg-blue-500 text-white shadow-sm gap-1.5"
                >
                  <Banknote className="h-4 w-4" />
                  <span>Добавить оплату</span>
                </Button>
              </div>

              {booking.status !== 'cancelled' && (
                <Button
                  variant="ghost"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange('cancelled')}
                  className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-11 rounded-2xl border border-red-500/20"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  <span>Отменить запись</span>
                </Button>
              )}
            </div>
          ) : (
            /* Payment Input Form */
            <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-3">
              <span className="text-xs font-bold text-blue-400 block">
                Зафиксировать оплату
              </span>

              <div>
                <Label htmlFor="pay-amt" className="text-xs text-zinc-400">Сумма, ₽</Label>
                <Input
                  id="pay-amt"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="h-11 mt-1 font-bold text-white bg-[#131722] border-white/10 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-400 block mb-1.5">Способ оплаты</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['card', 'cash', 'transfer'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`h-10 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        paymentMethod === m
                          ? 'border-blue-500 bg-blue-600 text-white font-bold shadow-sm'
                          : 'border-white/10 bg-[#131722] text-zinc-400 hover:text-white'
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
                  className="flex-1 rounded-xl h-11 text-zinc-400 hover:text-white border border-white/10"
                >
                  Отмена
                </Button>
                <Button
                  size="sm"
                  disabled={isUpdating}
                  onClick={handleRecordPayment}
                  className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Зафиксировать'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
