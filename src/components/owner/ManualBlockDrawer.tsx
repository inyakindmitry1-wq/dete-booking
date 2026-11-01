import React, { useState } from 'react';
import { DbTenant, DbResource } from '@/types/database';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { Lock, AlertTriangle, Loader2, X } from 'lucide-react';

interface ManualBlockDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: DbTenant;
  resources: DbResource[];
  selectedDate: string;
  onCreated: () => void;
}

export const ManualBlockDrawer: React.FC<ManualBlockDrawerProps> = ({
  isOpen,
  onClose,
  tenant,
  resources,
  selectedDate,
  onCreated,
}) => {
  const [selectedResourceId, setSelectedResourceId] = useState<string>(
    resources[0]?.id || ''
  );
  const [startTime, setStartTime] = useState<string>('12:00');
  const [endTime, setEndTime] = useState<string>('13:00');
  const [note, setNote] = useState<string>('Технический перерыв');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (!selectedResourceId) return;

    setIsLoading(true);
    setErrorMessage(null);

    const startIso = `${selectedDate}T${startTime}:00.000Z`;
    const endIso = `${selectedDate}T${endTime}:00.000Z`;

    try {
      await api.createManualBlock({
        tenant_id: tenant.id,
        resource_id: selectedResourceId,
        start_time: startIso,
        end_time: endIso,
        note: note.trim() || 'Блокировка поста',
      });
      onCreated();
      onClose();
    } catch (err: any) {
      console.error('Manual block error:', err);
      setErrorMessage(
        err.message?.includes('CONFLICT')
          ? 'На этот период уже есть запись или активная блокировка!'
          : 'Ошибка при сохранении блокировки'
      );
    } finally {
      setIsLoading(false);
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
                Заблокировать бокс
              </h2>
              <span className="text-xs text-zinc-400 block mt-0.5">
                Ограничение онлайн-записи на выбранный промежуток времени
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
                Выберите пост (бокс)
              </Label>
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="w-full h-12 rounded-xl bg-[#131722] border border-white/10 text-white px-3 text-sm focus:outline-none focus:border-blue-500"
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id} className="bg-zinc-900 text-white">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs text-zinc-400 font-medium mb-1.5 block">
                  Начало блокировки
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
                  Конец блокировки
                </Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-12 rounded-xl bg-[#131722] border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-zinc-400 font-medium mb-1.5 block">
                Причина (для внутреннего учета)
              </Label>
              <Input
                placeholder="Например: Техническое обслуживание или обед"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-12 rounded-xl bg-[#131722] border-white/10 text-white"
              />
            </div>

            <div className="pt-2">
              <Button
                disabled={isLoading || !selectedResourceId}
                onClick={handleSubmit}
                className="w-full h-13 rounded-2xl bg-[#2563eb] hover:bg-blue-500 text-white font-bold text-base shadow-[0_4px_20px_rgba(37,99,235,0.4)] active:scale-[0.99] transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Блокируем пост...</span>
                  </>
                ) : (
                  <span>Заблокировать</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
