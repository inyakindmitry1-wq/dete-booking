import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DbTenant } from '@/types/database';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Banknote,
  Car,
  CheckCircle,
  Calendar,
  Layers,
  TrendingUp,
  Info,
} from 'lucide-react';

interface AnalyticsViewProps {
  tenant: DbTenant;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tenant }) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const now = new Date();
  let startDate = startOfDay(now);
  let endDate = endOfDay(now);

  if (period === 'week') {
    startDate = startOfDay(subDays(now, 6));
  } else if (period === 'month') {
    startDate = startOfDay(subDays(now, 29));
  }

  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['owner-analytics', tenant.id, period, startIso, endIso],
    queryFn: () => api.getOwnerAnalytics(tenant.id, startIso, endIso),
  });

  return (
    <div className="space-y-4">
      {/* Period Selector Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-secondary/60 p-1 rounded-2xl border border-border">
        <button
          type="button"
          onClick={() => setPeriod('today')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            period === 'today'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Сегодня
        </button>
        <button
          type="button"
          onClick={() => setPeriod('week')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            period === 'week'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          7 дней
        </button>
        <button
          type="button"
          onClick={() => setPeriod('month')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            period === 'month'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          30 дней
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : stats ? (
        <div className="space-y-4">
          {/* Invariant 8: Realized Revenue Hero Card */}
          <Card className="p-5 border border-border bg-gradient-to-br from-card via-card to-secondary/30 shadow-md space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Фактическая выручка</span>
              <Banknote className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              {formatCurrency(stats.actual_revenue, tenant.currency)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <Info className="h-3 w-3 text-muted-foreground/80 shrink-0" />
              <span>Только фактически принятые оплаты (наличные, карты, перевод).</span>
            </div>
          </Card>

          {/* Operational Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Arrivals (Checked-in / Completed) */}
            <Card className="p-4 border border-border bg-card space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Заезды авто</span>
                <Car className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {stats.arrivals_count}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                Фактически прибыли в боксы
              </span>
            </Card>

            {/* Completed Jobs */}
            <Card className="p-4 border border-border bg-card space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Выполнено</span>
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {stats.completed_count}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                Заказы сданы клиентам
              </span>
            </Card>

            {/* Total Bookings */}
            <Card className="p-4 border border-border bg-card space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Всего записей</span>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {stats.total_bookings}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                Создано в системе
              </span>
            </Card>

            {/* Active Resources */}
            <Card className="p-4 border border-border bg-card space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Постов</span>
                <Layers className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {stats.active_resources}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                Активных постов / подъемников
              </span>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
};
