import React, { useState, useEffect } from 'react';
import { format, addMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DbTenant, DbBooking } from '@/types/database';
import { Button } from '@/components/ui/button';
import { BookingManagementModal } from './BookingManagementModal';
import { downloadIcsFile } from '@/lib/ics';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import {
  Check,
  Calendar,
  Clock,
  MapPin,
  Download,
  Share2,
  Settings2,
  Sparkles,
  User,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface StoredBooking {
  booking_id: string;
  access_token: string;
  service_name: string;
  start_time: string;
  price?: number;
  car_model?: string;
}

interface MyBookingsViewProps {
  tenant: DbTenant;
  onBookNew: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({ tenant, onBookNew }) => {
  const [storedList, setStoredList] = useState<StoredBooking[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeBooking, setActiveBooking] = useState<DbBooking | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`recent_bookings_${tenant.slug}`);
      if (raw) {
        const list: StoredBooking[] = JSON.parse(raw);
        setStoredList(list);
      }
    } catch {
      // ignore parse errors
    }
  }, [tenant.slug]);

  const currentStored = storedList[selectedIndex] || null;

  useEffect(() => {
    if (!currentStored) {
      setActiveBooking(null);
      return;
    }

    let isMounted = true;
    setIsLoadingBooking(true);

    api
      .lookupBooking(currentStored.booking_id, currentStored.access_token)
      .then((res) => {
        if (isMounted) {
          setActiveBooking(res);
        }
      })
      .catch((err) => {
        console.error('Failed to load booking details:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingBooking(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentStored?.booking_id, currentStored?.access_token]);

  if (storedList.length === 0) {
    return (
      <div className="py-12 px-4 text-center space-y-4 animate-in fade-in duration-200">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#131722] border border-white/10 text-zinc-400">
          <Calendar className="h-7 w-7 text-blue-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">
            Нет активных записей
          </h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Здесь будет отображаться карточка вашей подтвержденной записи в студию.
          </p>
        </div>
        <Button
          onClick={onBookNew}
          className="h-12 px-6 rounded-2xl font-bold bg-[#2563eb] hover:bg-blue-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)] active:scale-95"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          <span>Записаться в студию</span>
        </Button>
      </div>
    );
  }

  // Formatting values matching Photo 3:
  const serviceName = activeBooking?.service_name_snapshot || currentStored?.service_name || 'Услуга';
  const startTimeStr = activeBooking?.start_time || currentStored?.start_time || new Date().toISOString();
  const startDate = new Date(startTimeStr);

  // e.g. "30 сентября в 12:00"
  const formattedStart = format(startDate, "d MMMM 'в' HH:mm", { locale: ru });

  // Estimated completion: activeBooking.end_time or start + 120m
  const finishDate = activeBooking?.end_time ? new Date(activeBooking.end_time) : addMinutes(startDate, 120);
  const formattedFinish = format(finishDate, "d MMMM 'в' HH:mm", { locale: ru });

  const priceValue = activeBooking?.price_snapshot || currentStored?.price || 3500;
  const carModelValue = activeBooking?.car_model || currentStored?.car_model || activeBooking?.customer?.name || '';
  const studioAddress = `${tenant.city}, ${tenant.address}`;
  const studioShortName = tenant.name.split(' ')[0] || tenant.name;

  const shareableUrl = currentStored
    ? `${window.location.origin}/s/${tenant.slug}/booking/${currentStored.booking_id}?token=${currentStored.access_token}`
    : window.location.href;

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Запись в ${tenant.name}`,
          text: `${serviceName} в ${tenant.name}`,
          url: shareableUrl,
        });
        return;
      } catch {
        // user cancelled
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleDownloadCalendar() {
    if (!currentStored) return;
    downloadIcsFile({
      id: currentStored.booking_id,
      title: serviceName,
      description: `Запись на ${serviceName} в ${tenant.name}`,
      location: studioAddress,
      startTime: startTimeStr,
      endTime: finishDate.toISOString(),
      businessName: tenant.name,
    });
  }

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Switcher if client has multiple saved appointments */}
      {storedList.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {storedList.map((b, idx) => (
            <button
              key={b.booking_id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                idx === selectedIndex
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#131722] text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              Запись #{idx + 1} • {b.service_name}
            </button>
          ))}
        </div>
      )}

      {/* Top Header Row (Matching Photo 3: Logo + Name left, User icon right) */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg overflow-hidden bg-black/50 border border-white/10 shrink-0 flex items-center justify-center">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-full w-full object-cover" />
            ) : (
              <div className="font-black text-xs text-white">S</div>
            )}
          </div>
          <span className="text-sm font-bold text-white tracking-wider">
            {studioShortName}
          </span>
        </div>

        <div className="h-8 w-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-zinc-300">
          <User className="h-4 w-4" />
        </div>
      </div>

      {/* Main Page Title (Matching Photo 3: "Моя запись") */}
      <h1 className="text-2xl font-bold text-white tracking-tight pt-1">
        Моя запись
      </h1>

      {/* ==================================================================== */}
      {/* HERO STATUS CARD (Matching Photo 3 with Dot Grid & Cyan Glow)         */}
      {/* ==================================================================== */}
      <div
        className="relative rounded-3xl border border-white/10 p-5 overflow-hidden shadow-2xl"
        style={{
          backgroundColor: '#0a0d14',
          backgroundImage: `
            radial-gradient(circle at 85% 75%, rgba(59, 130, 246, 0.45) 0%, transparent 60%),
            radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, 14px 14px',
        }}
      >
        <div className="relative z-10 space-y-3">
          {/* Blue Circle with Checkmark Icon */}
          <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white shadow-[0_0_14px_rgba(37,99,235,0.55)]">
            <Check className="h-4 w-4 stroke-[3]" />
          </div>

          <div>
            <span className="text-xs text-zinc-400 font-medium block">
              {studioShortName}
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
              Подтверждена
            </h3>
            <p className="text-sm text-zinc-300 font-medium mt-1">
              {formattedStart}
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ORDER DETAILS SECTION (Matching Photo 3 Typography & Hierarchy)       */}
      {/* ==================================================================== */}
      <div className="pt-2 space-y-4">
        {/* Service Name */}
        <h2 className="text-xl font-bold text-white tracking-tight">
          {serviceName}
        </h2>

        {/* Key-Value Details */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Стоимость</span>
            <span className="font-bold text-white">
              {formatCurrency(priceValue, tenant.currency)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Выдача, ориентир</span>
            <span className="text-white">
              {formattedFinish}
            </span>
          </div>

          {carModelValue && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Автомобиль</span>
              <span className="font-medium text-white">
                {carModelValue}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Адрес</span>
            <span className="text-white text-right max-w-[220px] truncate">
              {studioAddress}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ACTION BUTTONS (Matching Reference Functional Bar)                   */}
      {/* ==================================================================== */}
      <div className="pt-4 space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="outline"
            onClick={handleDownloadCalendar}
            className="h-12 rounded-2xl text-xs font-semibold gap-2 border-white/10 bg-[#131722]/80 hover:bg-[#1c2233] text-white active:scale-[0.98]"
          >
            <Download className="h-4 w-4 text-blue-400" />
            <span>В календарь</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleShare}
            className="h-12 rounded-2xl text-xs font-semibold gap-2 border-white/10 bg-[#131722]/80 hover:bg-[#1c2233] text-white active:scale-[0.98]"
          >
            <Share2 className="h-4 w-4 text-blue-400" />
            <span>{copied ? 'Скопировано!' : 'Поделиться'}</span>
          </Button>
        </div>

        {activeBooking && activeBooking.status === 'confirmed' && currentStored && (
          <Button
            variant="ghost"
            onClick={() => setIsManageModalOpen(true)}
            className="w-full h-11 rounded-2xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 gap-2"
          >
            <Settings2 className="h-4 w-4" />
            <span>Перенести или отменить запись</span>
          </Button>
        )}
      </div>

      {/* Reschedule / Cancel Modal */}
      {activeBooking && currentStored && (
        <BookingManagementModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          booking={activeBooking}
          tenant={tenant}
          accessToken={currentStored.access_token}
          onUpdated={() => {
            api
              .lookupBooking(currentStored.booking_id, currentStored.access_token)
              .then(setActiveBooking)
              .catch(console.error);
          }}
        />
      )}
    </div>
  );
};
