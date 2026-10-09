import React, { useState } from 'react';
import { DbTenant, DbResource } from '@/types/database';
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
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Lock, AlertTriangle, Loader2 } from 'lucide-react';

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
      <DrawerContent className="max-w-md mx-auto">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-400" />
            <span>Блокировка рабочего поста</span>
          </DrawerTitle>
          <DrawerDescription>
            Закрыть интервал для техобслуживания, обеда или живой очереди
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 px-1">
          {errorMessage && (
            <div className="p-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <Label className="text-xs mb-1.5 block">Выберите пост</Label>
            <div className="grid grid-cols-1 gap-2">
              {resources.map((r) => {
                const isSelected = selectedResourceId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedResourceId(r.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary/40 text-muted-foreground'
                    }`}
                  >
                    <span>{r.name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{r.type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Начало</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-11 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Окончание</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-11 font-mono"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Причина / Примечание</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ремонт подъемника / Обед"
              className="h-11"
            />
          </div>
        </div>

        <DrawerFooter>
          <Button
            disabled={isLoading || !selectedResourceId}
            onClick={handleSubmit}
            className="w-full h-12 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-black shadow-md"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Заблокировать пост'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
