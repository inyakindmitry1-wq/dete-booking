import React, { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DbBooking, DbTenant, TimeSlot } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SlotPicker } from './SlotPicker';
import { useSlots } from '@/hooks/useSlots';
import { api } from '@/lib/api';
import { AlertTriangle, Calendar, Loader2, XCircle } from 'lucide-react';

interface BookingManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: DbBooking;
  tenant: DbTenant;
  accessToken: string;
  onUpdated: () => void;
}

export const BookingManagementModal: React.FC<BookingManagementModalProps> = ({
  isOpen,
  onClose,
  booking,
  tenant,
  accessToken,
  onUpdated,
}) => {
  const [mode, setMode] = useState<'view' | 'reschedule' | 'cancel'>('view');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: slots, isLoading: isSlotsLoading } = useSlots(
    tenant,
    booking.service_id,
    selectedDate
  );

  async function handleReschedule() {
    if (!selectedSlot) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await api.rescheduleBooking(booking.id, accessToken, selectedSlot.time);
      onUpdated();
      onClose();
    } catch (err: any) {
      console.error('Reschedule error:', err);
      setErrorMessage(err.message || 'Не удалось перенести запись на это время. Попробуйте другой слот.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancel() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await api.cancelBooking(booking.id, accessToken, 'Отменено клиентом');
      onUpdated();
      onClose();
    } catch (err: any) {
      console.error('Cancel error:', err);
      setErrorMessage(err.message || 'Не удалось отменить запись.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'view' && 'Управление записью'}
            {mode === 'reschedule' && 'Перенос записи на другое время'}
            {mode === 'cancel' && 'Отмена записи'}
          </DialogTitle>
          <DialogDescription>
            {booking.service_name_snapshot} • {tenant.name}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {mode === 'view' && (
          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-xl border border-border bg-secondary/40 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Текущее время:</span>
                <span className="font-semibold text-foreground">
                  {format(new Date(booking.start_time), 'd MMM yyyy, HH:mm', { locale: ru })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Статус:</span>
                <span className="font-semibold text-primary capitalize">{booking.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setMode('reschedule')}
                className="h-11 rounded-xl font-semibold gap-1.5"
              >
                <Calendar className="h-4 w-4 text-primary" />
                <span>Перенести</span>
              </Button>
              <Button
                variant="destructive"
                onClick={() => setMode('cancel')}
                className="h-11 rounded-xl font-semibold gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                <span>Отменить</span>
              </Button>
            </div>
          </div>
        )}

        {mode === 'reschedule' && (
          <div className="space-y-4 py-2">
            <SlotPicker
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                setSelectedDate(d);
                setSelectedSlot(null);
              }}
              selectedSlotTime={selectedSlot?.time || null}
              onSelectSlot={setSelectedSlot}
              slots={slots}
              isLoading={isSlotsLoading}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setMode('view')}>
                Назад
              </Button>
              <Button
                disabled={!selectedSlot || isLoading}
                onClick={handleReschedule}
                className="font-bold"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Подтвердить перенос'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {mode === 'cancel' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Вы уверены, что хотите отменить запись? Забронированное место на посту будет освобождено.
            </p>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setMode('view')}>
                Не отменять
              </Button>
              <Button
                variant="destructive"
                disabled={isLoading}
                onClick={handleCancel}
                className="font-bold"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Да, отменить запись'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
