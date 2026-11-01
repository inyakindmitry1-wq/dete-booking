import React, { useState } from 'react';
import { DbTenant, DbService, DbResource } from '@/types/database';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { generateAccessToken } from '@/lib/crypto';
import { formatCurrency, formatDuration } from '@/lib/utils';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface ManualBookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: DbTenant;
  resources: DbResource[];
  services: DbService[];
  selectedDate: string;
  onCreated: () => void;
}

export const ManualBookingDrawer: React.FC<ManualBookingDrawerProps> = ({
  isOpen,
  onClose,
  tenant,
  resources,
  services,
  selectedDate,
  onCreated,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+7 ');
  const [carModel, setCarModel] = useState('');
  const [startTime, setStartTime] = useState('12:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  async function handleSubmit() {
    if (!selectedService || customerName.trim().length < 2) {
      setErrorMessage('Укажите имя клиента и услугу');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const rawAccessToken = generateAccessToken(32);
      const idempotencyKey = `owner-${tenant.slug}-${Date.now()}`;
      const startIso = `${selectedDate}T${startTime}:00.000Z`;

      await api.createBooking(
        {
          tenant_slug: tenant.slug,
          service_id: selectedService.id,
          start_time: startIso,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || '+7 999 000-00-00',
          car_model: carModel.trim() || undefined,
          idempotency_key: idempotencyKey,
        },
        rawAccessToken
      );

      onCreated();
      onClose();
    } catch (err: any) {
      console.error('Manual booking error:', err);
      setErrorMessage(err.message || 'Ошибка при создании записи');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-md mx-auto bg-[#0b0e14] border-t border-white/10 text-white rounded-t-[28px] focus:outline-none">
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20 shrink-0" />

        <div className="px-5 pt-3 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
                Новая запись
              </h2>
              <span className="text-xs text-zinc-400 block mt-0.5">
                Добавление записи вручную администратором
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

          {errorMessage && (
            <div className="p-3 rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <Label className="text-xs text-zinc-400 font-medium mb-1.5 block">
                Услуга
              </Label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full h-12 rounded-xl bg-[#131722] border border-white/10 text-white px-3 text-sm focus:outline-none focus:border-blue-500"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                    {s.name} — {formatCurrency(s.price, tenant.currency)} ({formatDuration(s.duration_minutes)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs text-zinc-400 font-medium mb-1.5 block">
                  Время заезда
                </Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-12 rounded-xl bg-[#131722] border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-400 font-medium mb-1.5 block">
                  Дата
                </Label>
                <Input
                  type="text"
                  readOnly
                  value={selectedDate}
                  className="h-12 rounded-xl bg-[#131722]/50 border-white/10 text-zinc-400"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-zinc-400 font-medium mb-1.5 block">
                Имя клиента *
              </Label>
              <Input
                placeholder="Иван"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-12 rounded-xl bg-[#131722] border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400 font-medium mb-1.5 block">
                Номер телефона
              </Label>
              <Input
                type="tel"
                placeholder="+7 999 123-45-67"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-12 rounded-xl bg-[#131722] border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400 font-medium mb-1.5 block">
                Автомобиль
              </Label>
              <Input
                placeholder="Марка и модель (например: Porsche Panamera)"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                className="h-12 rounded-xl bg-[#131722] border-white/10 text-white"
              />
            </div>

            <div className="pt-2">
              <Button
                disabled={isSubmitting || customerName.trim().length < 2}
                onClick={handleSubmit}
                className="w-full h-13 rounded-2xl bg-[#2563eb] hover:bg-blue-500 text-white font-bold text-base shadow-[0_4px_20px_rgba(37,99,235,0.4)] active:scale-[0.99] transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Создаем запись...</span>
                  </>
                ) : (
                  <span>Записать клиента</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
