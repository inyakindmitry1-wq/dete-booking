import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DbTenant, DbService, TimeSlot, CreateBookingResponse } from '@/types/database';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SlotPicker } from './SlotPicker';
import { VehicleTypeSelector, VehicleCategory } from './VehicleTypeSelector';
import { getServicePriceForClass, VEHICLE_NAMES } from '@/lib/pricing';
import { useSlots } from '@/hooks/useSlots';
import { api } from '@/lib/api';
import { generateAccessToken } from '@/lib/crypto';
import { formatCurrency, formatDuration, cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, X, AlertTriangle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface BookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  service: DbService | null;
  services?: DbService[];
  tenant: DbTenant;
  onBookingComplete: (booking: CreateBookingResponse) => void;
}

export const BookingDrawer: React.FC<BookingDrawerProps> = ({
  isOpen,
  onClose,
  service,
  services = [],
  tenant,
  onBookingComplete,
}) => {
  const [selectedService, setSelectedService] = useState<DbService | null>(service);
  // Step 0: Choose service (if opened without service)
  // Step 1: "Дата и время" (Photo 1 - Шаг 2 из 4)
  // Step 2: "Ваш автомобиль" (Photo 2 - Шаг 3 из 4)
  const [step, setStep] = useState<0 | 1 | 2>(service ? 1 : 0);
  const [vehicleType, setVehicleType] = useState<VehicleCategory>('sedan');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Form Fields (Photo 2)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+7 ');
  const [carModel, setCarModel] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync service selection when drawer opens or service prop updates
  useEffect(() => {
    if (isOpen) {
      if (service) {
        setSelectedService(service);
        setStep(1);
      } else {
        setSelectedService(null);
        setStep(0);
      }
    }
  }, [service, isOpen]);

  // Fetch slots for current selected service
  const { data: slots, isLoading: isSlotsLoading } = useSlots(
    tenant,
    selectedService?.id || null,
    selectedDate
  );

  const canProceedToStep2 = Boolean(selectedSlot && selectedSlot.is_available);
  const canSubmit = customerName.trim().length >= 2 && customerPhone.trim().length >= 10;

  const activePrice = selectedService
    ? getServicePriceForClass(selectedService.price, selectedService.name, vehicleType)
    : 0;

  async function handleSubmitBooking() {
    if (!selectedService || !selectedSlot || !canSubmit) return;

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
          service_id: selectedService.id,
          start_time: selectedSlot.time,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          car_model: carModel.trim() || undefined,
          car_plate: carPlate.trim() || undefined,
          vehicle_type: vehicleType,
          customer_notes: customerNotes.trim() || undefined,
          idempotency_key: idempotencyKey,
        },
        rawAccessToken
      );

      // 4. Save token to localStorage so client can view/check booking without login
      try {
        const stored = JSON.parse(localStorage.getItem(`recent_bookings_${tenant.slug}`) || '[]');
        stored.unshift({
          booking_id: response.booking_id,
          access_token: response.access_token,
          service_name: response.service_name,
          start_time: response.start_time,
          price: response.price,
          car_model: carModel.trim() || undefined,
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
    setStep(service ? 1 : 0);
    setSelectedSlot(null);
    setErrorMessage(null);
    onClose();
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleResetAndClose()}>
      <DrawerContent className="max-w-md mx-auto bg-[#0b0e14] border-t border-white/10 text-white rounded-t-[28px] focus:outline-none">
        {/* Top Centered Drag Handle (Matching Photo 1 & 2) */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20 shrink-0" />

        <div className="px-5 pt-3 pb-6 space-y-4">
          {/* ==================================================================== */}
          {/* HEADER SECTION (Matching Photo 1 & Photo 2)                         */}
          {/* ==================================================================== */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
                  {step === 0
                    ? 'Выберите услугу'
                    : step === 1
                    ? 'Дата и время'
                    : 'Ваш автомобиль'}
                </h2>
                <span className="text-xs text-zinc-400 block mt-0.5">
                  {step === 0
                    ? 'Шаг 1 из 4'
                    : step === 1
                    ? 'Шаг 2 из 4'
                    : 'Шаг 3 из 4'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 -mr-1">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Назад"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                {step === 1 && services.length > 0 && !service && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSlot(null);
                      setStep(0);
                    }}
                    className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="К выбору услуг"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Закрыть"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 4-Segmented Progress Bar (Matching Photo 1 & 2) */}
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              <div
                className={cn(
                  "h-1 rounded-full transition-colors",
                  step >= 0 ? "bg-[#2563eb]" : "bg-white/10"
                )}
              />
              <div
                className={cn(
                  "h-1 rounded-full transition-colors",
                  step >= 1 ? "bg-[#2563eb]" : "bg-white/10"
                )}
              />
              <div
                className={cn(
                  "h-1 rounded-full transition-colors",
                  step >= 2 ? "bg-[#2563eb]" : "bg-white/10"
                )}
              />
              <div
                className={cn(
                  "h-1 rounded-full transition-colors",
                  "bg-white/10"
                )}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ==================================================================== */}
          {/* STEP 0: Select Service (if opened from quick book hero)              */}
          {/* ==================================================================== */}
          {step === 0 && (
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-0.5 scrollbar-none">
              <span className="text-xs font-semibold text-zinc-400 block">
                Доступные услуги ({services.length})
              </span>
              {services.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => {
                    setSelectedService(svc);
                    setSelectedSlot(null);
                    setStep(1);
                  }}
                  className="w-full text-left p-3.5 rounded-2xl border border-white/10 bg-[#131722]/80 hover:bg-[#1c2233] hover:border-white/20 transition-all flex items-center gap-3.5 select-none"
                >
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden shrink-0 bg-black border border-white/10">
                    <img
                      src={svc.image_url}
                      alt={svc.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      {svc.category}
                    </span>
                    <h4 className="text-sm font-bold text-white truncate">
                      {svc.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="font-extrabold text-white">
                        {svc.price > 0 ? formatCurrency(svc.price, tenant.currency) : 'Бесплатно (0 ₽)'}
                      </span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-zinc-400 font-medium text-[11px]">
                        {formatDuration(svc.duration_minutes)}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-400 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* ==================================================================== */}
          {/* STEP 1: "Дата и время" (Photo 1 - Шаг 2 из 4)                        */}
          {/* ==================================================================== */}
          {step === 1 && selectedService && (
            <div className="space-y-4">
              {/* Service & Price Row (Matching Photo 1: "Комплексная мойка" | "3 500 ₽") */}
              <div className="flex items-center justify-between py-1">
                <span className="text-base font-semibold text-white tracking-tight">
                  {selectedService.name}
                </span>
                <span className="text-base font-semibold text-white">
                  {activePrice > 0 ? formatCurrency(activePrice, tenant.currency) : 'Бесплатно (0 ₽)'}
                </span>
              </div>

              {/* Slot Picker (7 Day Cards + "Другая дата" + "25 сент. 2026г." + slots) */}
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

              {/* Vehicle Class Selector (Sedan / Crossover / SUV) */}
              <div className="pt-1">
                <VehicleTypeSelector
                  value={vehicleType}
                  onChange={setVehicleType}
                  service={selectedService}
                  currency={tenant.currency}
                />
              </div>

              {/* Action Button: "Продолжить" */}
              <div className="pt-2">
                <Button
                  disabled={!canProceedToStep2}
                  onClick={() => setStep(2)}
                  className="w-full h-13 rounded-2xl text-base font-bold bg-[#2563eb] hover:bg-blue-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none active:scale-[0.99] transition-all"
                >
                  Продолжить
                </Button>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* STEP 2: "Ваш автомобиль" (Photo 2 - Шаг 3 из 4)                      */}
          {/* ==================================================================== */}
          {step === 2 && selectedService && (
            <div className="space-y-4 pt-1">
              {/* Field 1: Имя (Matching Photo 2) */}
              <div>
                <Label htmlFor="cust-name" className="text-xs text-zinc-400 font-medium mb-1.5 block">
                  Имя
                </Label>
                <Input
                  id="cust-name"
                  placeholder="Ваше имя"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoComplete="name"
                  className="h-13 rounded-2xl bg-[#131722] border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-blue-500 text-base px-4"
                  required
                />
              </div>

              {/* Field 2: Телефон (Matching Photo 2 with glowing blue focused ring) */}
              <div>
                <Label htmlFor="cust-phone" className="text-xs text-zinc-400 font-medium mb-1.5 block">
                  Телефон
                </Label>
                <Input
                  id="cust-phone"
                  type="tel"
                  placeholder="+7 999 123-45-67"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  autoComplete="tel"
                  className="h-13 rounded-2xl bg-[#131722] border-blue-500 ring-2 ring-blue-500/50 shadow-[0_0_16px_rgba(59,130,246,0.35)] text-white placeholder:text-zinc-500 text-base px-4"
                  required
                />
              </div>

              {/* Field 3: Автомобиль (Matching Photo 2) */}
              <div>
                <Label htmlFor="cust-car" className="text-xs text-zinc-400 font-medium mb-1.5 block">
                  Автомобиль
                </Label>
                <Input
                  id="cust-car"
                  placeholder="Марка и модель"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="h-13 rounded-2xl bg-[#131722] border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-blue-500 text-base px-4"
                />
              </div>

              {/* Optional госномер & пожелания collapsible */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium select-none transition-colors"
                >
                  <span>{showOptionalFields ? 'Скрыть дополнительные поля' : '+ Указать госномер и пожелания'}</span>
                  {showOptionalFields ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {showOptionalFields && (
                  <div className="space-y-3 pt-3 animate-in fade-in duration-150">
                    <div>
                      <Label htmlFor="cust-plate" className="text-xs text-zinc-400 font-medium mb-1.5 block">
                        Госномер (опция)
                      </Label>
                      <Input
                        id="cust-plate"
                        placeholder="А 777 АА 77"
                        value={carPlate}
                        onChange={(e) => setCarPlate(e.target.value)}
                        className="h-12 rounded-xl bg-[#131722] border-white/10 text-white placeholder:text-zinc-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cust-notes" className="text-xs text-zinc-400 font-medium mb-1.5 block">
                        Комментарий или пожелания
                      </Label>
                      <Input
                        id="cust-notes"
                        placeholder="Особые пожелания или состояние автомобиля"
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        className="h-12 rounded-xl bg-[#131722] border-white/10 text-white placeholder:text-zinc-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Button (Matching Photo 2: "Оформить запись") */}
              <div className="pt-3">
                <Button
                  disabled={!canSubmit || isSubmitting}
                  onClick={handleSubmitBooking}
                  className="w-full h-14 rounded-2xl bg-[#2563eb] hover:bg-blue-500 text-white font-bold text-base shadow-[0_4px_24px_rgba(37,99,235,0.45)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Оформляем запись...</span>
                    </>
                  ) : (
                    <span>Оформить запись</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
