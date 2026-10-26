import React, { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DbTenant, DbService, TimeSlot, CreateBookingResponse } from '@/types/database';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SlotPicker } from './SlotPicker';
import { VehicleTypeSelector, VehicleCategory } from './VehicleTypeSelector';
import { useSlots } from '@/hooks/useSlots';
import { api } from '@/lib/api';
import { generateAccessToken } from '@/lib/crypto';
import { formatCurrency, formatDuration } from '@/lib/utils';
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';

interface BookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  service: DbService | null;
  tenant: DbTenant;
  onBookingComplete: (booking: CreateBookingResponse) => void;
}

export const BookingDrawer: React.FC<BookingDrawerProps> = ({
  isOpen,
  onClose,
  service,
  tenant,
  onBookingComplete,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [vehicleType, setVehicleType] = useState<VehicleCategory>('sedan');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+7 ');
  const [carModel, setCarModel] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch slots
  const { data: slots, isLoading: isSlotsLoading } = useSlots(
    tenant,
    service?.id || null,
    selectedDate
  );

  if (!service) return null;

  const canProceedToStep2 = selectedSlot && selectedSlot.is_available;
  const canSubmit = customerName.trim().length >= 2 && customerPhone.trim().length >= 10;

  async function handleSubmitBooking() {
    if (!service || !selectedSlot || !canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Generate client-side cryptographic access token (64 hex characters)
      const rawAccessToken = generateAccessToken(32);

      // 2. Client idempotency key for this attempt
      const idempotencyKey = `req-${tenant.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // 3. Atomic booking creation call
      const response = await api.createBooking(
        {
          tenant_slug: tenant.slug,
          service_id: service.id,
          start_time: selectedSlot.time,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          car_model: carModel.trim() || undefined,
          car_plate: carPlate.trim() || undefined,
          customer_notes: customerNotes.trim() || undefined,
          idempotency_key: idempotencyKey,
        },
        rawAccessToken
      );

      // 4. Save token to localStorage so returning client can check booking without re-login
      try {
        const stored = JSON.parse(localStorage.getItem(`recent_bookings_${tenant.slug}`) || '[]');
        stored.unshift({
          booking_id: response.booking_id,
          access_token: response.access_token,
          service_name: response.service_name,
          start_time: response.start_time,
        });
        localStorage.setItem(`recent_bookings_${tenant.slug}`, JSON.stringify(stored.slice(0, 10)));
      } catch {
        // ignore storage errors
      }

      onBookingComplete(response);
    } catch (err: any) {
      console.error('Booking error:', err);
      if (err.message?.includes('NO_AVAILABLE_RESOURCE_SLOT') || err.message?.includes('CONFLICT')) {
        setErrorMessage('К сожалению, это время только что заняли. Пожалуйста, выберите другое время.');
        setStep(1);
      } else {
        setErrorMessage(err.message || 'Произошла ошибка при бронировании. Пожалуйста, попробуйте снова.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResetAndClose() {
    setStep(1);
    setSelectedSlot(null);
    setErrorMessage(null);
    onClose();
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleResetAndClose()}>
      <DrawerContent className="max-w-md mx-auto">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            {step === 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Назад</span>
              </Button>
            )}
            <div className="text-left flex-1">
              <DrawerTitle>
                {step === 1 ? 'Выбор времени записи' : 'Контактные данные'}
              </DrawerTitle>
              <DrawerDescription>
                {service.name} • {formatCurrency(service.price, tenant.currency)}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 1 && (
            <>
              {/* Vehicle Type Selection */}
              <VehicleTypeSelector value={vehicleType} onChange={setVehicleType} />

              {/* Slot Picker */}
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

              {/* Selected Slot Summary */}
              {selectedSlot && (
                <div className="p-3.5 rounded-2xl bg-[#161619] border border-white/15 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-white shrink-0" />
                    <div>
                      <span className="text-[11px] text-zinc-400 block font-medium">Выбранное время</span>
                      <span className="text-sm font-bold text-white">
                        {format(new Date(selectedSlot.time), 'd MMMM (EEEE), HH:mm', { locale: ru })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1 justify-end">
                      <Clock className="h-3.5 w-3.5 text-zinc-300" />
                      {formatDuration(service.duration_minutes)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cust-name" className="text-xs font-semibold mb-1.5 block">
                  Ваше имя *
                </Label>
                <Input
                  id="cust-name"
                  placeholder="Иван Иванов"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cust-phone" className="text-xs font-semibold mb-1.5 block">
                  Номер телефона *
                </Label>
                <Input
                  id="cust-phone"
                  type="tel"
                  placeholder="+7 (999) 000-00-00"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  autoComplete="tel"
                  required
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  На этот номер придет подтверждение записи
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cust-car" className="text-xs font-semibold mb-1.5 block">
                    Марка и модель
                  </Label>
                  <Input
                    id="cust-car"
                    placeholder="BMW 530d"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cust-plate" className="text-xs font-semibold mb-1.5 block">
                    Госномер (опция)
                  </Label>
                  <Input
                    id="cust-plate"
                    placeholder="А 777 АА 77"
                    value={carPlate}
                    onChange={(e) => setCarPlate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cust-notes" className="text-xs font-semibold mb-1.5 block">
                  Пожелания или комментарии
                </Label>
                <Input
                  id="cust-notes"
                  placeholder="Особые пожелания или состояние авто"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                />
              </div>

              {/* Booking Summary Box */}
              {selectedSlot && (
                <div className="p-3.5 rounded-2xl border border-white/10 bg-[#161619] space-y-1.5 text-xs shadow-md">
                  <div className="flex justify-between text-zinc-400">
                    <span>Услуга:</span>
                    <span className="font-semibold text-white">{service.name}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Дата и время:</span>
                    <span className="font-semibold text-white">
                      {format(new Date(selectedSlot.time), 'd MMM yyyy, HH:mm', { locale: ru })}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Длительность:</span>
                    <span className="font-semibold text-white">
                      {formatDuration(service.duration_minutes)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 text-sm">
                    <span className="font-bold text-white">К оплате в студии:</span>
                    <span className="font-black text-white text-base">
                      {formatCurrency(service.price, tenant.currency)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DrawerFooter>
          {step === 1 ? (
            <Button
              disabled={!canProceedToStep2}
              onClick={() => setStep(2)}
              className="w-full h-12 rounded-xl text-base font-bold shadow-md"
            >
              Продолжить
            </Button>
          ) : (
            <Button
              disabled={!canSubmit || isSubmitting}
              onClick={handleSubmitBooking}
              className="w-full h-12 rounded-xl text-base font-bold shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Оформляем запись...
                </>
              ) : (
                'Подтвердить запись'
              )}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
