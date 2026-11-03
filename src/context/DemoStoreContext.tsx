import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  StudioPreset,
  ServiceItem,
  UpsellOffer,
} from '@/studios/types';
import {
  getActiveStudio,
  getActiveStudioSlug,
  getAllStudios,
  studiosRegistry,
  applyStudioBranding,
  DEFAULT_STUDIO_SLUG,
} from '@/studios';
import { api } from '@/lib/api';
import { generateAccessToken } from '@/lib/crypto';

export interface SelectedCar {
  name: string;
  category: 'sedan' | 'crossover' | 'suv';
  carClass: 'class_1_sedan' | 'class_2_suv' | 'class_3_xl';
  categoryLabel: string;
}

export interface CreatedAppointment {
  bookingId: string;
  accessToken: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  price: number;
  carModel: string;
}

interface DemoStoreContextValue {
  studio: StudioPreset;
  allStudios: StudioPreset[];
  services: ServiceItem[];
  upsellOffer: UpsellOffer;
  selectedCar: SelectedCar;
  setSelectedCar: React.Dispatch<React.SetStateAction<SelectedCar>>;
  switchStudio: (slug: string) => void;
  resetToDefaults: () => void;
  updateServicePrice: (
    serviceId: string,
    carClass: 'class_1_sedan' | 'class_2_suv' | 'class_3_xl',
    price: number
  ) => void;
  createAppointment: (params: {
    serviceId?: string;
    serviceName?: string;
    dateStr?: string;
    timeStr?: string;
    price?: number;
    carModel?: string;
    customerName?: string;
    customerPhone?: string;
  }) => Promise<CreatedAppointment>;
}

const DemoStoreContext = createContext<DemoStoreContextValue | undefined>(undefined);

function getStorageKey(slug: string) {
  return `detailing_demo_state_${slug}_v1`;
}

export const DemoStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSlug, setCurrentSlug] = useState<string>(() => getActiveStudioSlug());
  const activeStudio = studiosRegistry[currentSlug] || studiosRegistry[DEFAULT_STUDIO_SLUG];

  // Load services for the active studio from isolated localStorage or preset fallback
  const [services, setServices] = useState<ServiceItem[]>(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(activeStudio.slug));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.services && Array.isArray(parsed.services)) {
          return parsed.services;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored demo store:', e);
    }
    return activeStudio.services;
  });

  const [upsellOffer, setUpsellOffer] = useState<UpsellOffer>(activeStudio.upsellOffer);

  // When active studio changes, update services and apply dynamic branding
  useEffect(() => {
    applyStudioBranding(activeStudio);

    try {
      const stored = localStorage.getItem(getStorageKey(activeStudio.slug));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.services && Array.isArray(parsed.services)) {
          setServices(parsed.services);
          if (parsed.upsellOffer) setUpsellOffer(parsed.upsellOffer);
          return;
        }
      }
    } catch {
      // fallback
    }
    setServices(activeStudio.services);
    setUpsellOffer(activeStudio.upsellOffer);
  }, [activeStudio.slug]);

  // Persist edits to isolated studio storage
  useEffect(() => {
    try {
      localStorage.setItem(
        getStorageKey(activeStudio.slug),
        JSON.stringify({ services, upsellOffer })
      );
    } catch (e) {
      console.warn('Failed to persist demo store:', e);
    }
  }, [services, upsellOffer, activeStudio.slug]);

  // Switch active studio in-place and update URL ?studio=<slug>
  const switchStudio = useCallback((slug: string) => {
    const target = studiosRegistry[slug.toLowerCase()];
    if (!target) return;

    setCurrentSlug(target.slug);

    // Update URL query parameter without full page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('studio', target.slug);
      window.history.pushState({}, '', url.toString());
      // Trigger popstate so route or listeners can detect if needed
      window.dispatchEvent(new Event('popstate'));
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    setServices(activeStudio.services);
    setUpsellOffer(activeStudio.upsellOffer);
    try {
      localStorage.removeItem(getStorageKey(activeStudio.slug));
    } catch {
      // ignore
    }
  }, [activeStudio]);

  const updateServicePrice = useCallback(
    (
      serviceId: string,
      carClass: 'class_1_sedan' | 'class_2_suv' | 'class_3_xl',
      price: number
    ) => {
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? { ...s, prices: { ...s.prices, [carClass]: price } }
            : s
        )
      );
    },
    []
  );

  const [selectedCar, setSelectedCar] = useState<SelectedCar>({
    name: 'BMW 3 Series (Седан)',
    category: 'sedan',
    carClass: 'class_1_sedan',
    categoryLabel: 'Седан',
  });

  const createAppointment = useCallback(
    async (params: {
      serviceId?: string;
      serviceName?: string;
      dateStr?: string;
      timeStr?: string;
      price?: number;
      carModel?: string;
      customerName?: string;
      customerPhone?: string;
    }): Promise<CreatedAppointment> => {
      // 1. Resolve matching service from active studio catalog
      const queryName = (params.serviceName || '').toLowerCase();
      const matchedService =
        (params.serviceId && services.find((s) => s.id === params.serviceId)) ||
        (queryName &&
          services.find(
            (s) =>
              s.name.toLowerCase().includes(queryName) ||
              queryName.includes(s.name.toLowerCase())
          )) ||
        services[0];

      const carModel = params.carModel || selectedCar.name;
      const carClass = selectedCar.carClass;
      const resolvedPrice =
        params.price !== undefined
          ? params.price
          : matchedService ? (matchedService.prices[carClass] ?? 0) : 0;

      // 2. Resolve start time ISO
      const targetTime = params.timeStr && /^\d{2}:\d{2}$/.test(params.timeStr) ? params.timeStr : '14:00';
      let startTimeIso: string;
      if (params.dateStr && /^\d{4}-\d{2}-\d{2}$/.test(params.dateStr)) {
        startTimeIso = `${params.dateStr}T${targetTime}:00`;
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        startTimeIso = `${yyyy}-${mm}-${dd}T${targetTime}:00`;
      }

      const rawAccessToken = generateAccessToken(32);
      const idempotencyKey = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      try {
        const res = await api.createBooking(
          {
            tenant_slug: activeStudio.slug,
            service_id: matchedService?.id || 'service-wash',
            start_time: startTimeIso,
            customer_name: params.customerName || 'Клиент (AI-запись)',
            customer_phone: params.customerPhone || '+7 (999) 000-00-00',
            car_model: carModel,
            vehicle_type: selectedCar.category,
            idempotency_key: idempotencyKey,
          },
          rawAccessToken
        );

        // Store into localStorage for "Мои записи" view
        try {
          const key = `recent_bookings_${activeStudio.slug}`;
          const stored = JSON.parse(localStorage.getItem(key) || '[]');
          stored.unshift({
            booking_id: res.booking_id,
            access_token: res.access_token,
            service_name: res.service_name,
            start_time: res.start_time,
            price: res.price,
            car_model: carModel,
          });
          localStorage.setItem(key, JSON.stringify(stored.slice(0, 10)));
          window.dispatchEvent(new CustomEvent('detailing_booking_created', { detail: res }));
        } catch (e) {
          console.warn('Failed to save to local recent_bookings:', e);
        }

        return {
          bookingId: res.booking_id,
          accessToken: res.access_token,
          serviceName: res.service_name,
          startTime: res.start_time,
          endTime: res.end_time,
          price: res.price,
          carModel,
        };
      } catch {
        // Safe fallback in mock state
        const fallbackBookingId = `bk-${Date.now().toString(36)}`;
        const fallbackResult: CreatedAppointment = {
          bookingId: fallbackBookingId,
          accessToken: rawAccessToken,
          serviceName: matchedService ? matchedService.name : (params.serviceName || 'Детейлинг-мойка'),
          startTime: startTimeIso,
          endTime: new Date(new Date(startTimeIso).getTime() + 7200000).toISOString(),
          price: resolvedPrice,
          carModel,
        };

        try {
          const key = `recent_bookings_${activeStudio.slug}`;
          const stored = JSON.parse(localStorage.getItem(key) || '[]');
          stored.unshift({
            booking_id: fallbackResult.bookingId,
            access_token: fallbackResult.accessToken,
            service_name: fallbackResult.serviceName,
            start_time: fallbackResult.startTime,
            price: fallbackResult.price,
            car_model: carModel,
          });
          localStorage.setItem(key, JSON.stringify(stored.slice(0, 10)));
          window.dispatchEvent(new CustomEvent('detailing_booking_created', { detail: fallbackResult }));
        } catch {
          // ignore
        }

        return fallbackResult;
      }
    },
    [activeStudio.slug, services, selectedCar]
  );

  return (
    <DemoStoreContext.Provider
      value={{
        studio: activeStudio,
        allStudios: getAllStudios(),
        services,
        upsellOffer,
        selectedCar,
        setSelectedCar,
        switchStudio,
        resetToDefaults,
        updateServicePrice,
        createAppointment,
      }}
    >
      {children}
    </DemoStoreContext.Provider>
  );
};

export const useDemoStore = () => {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) {
    throw new Error('useDemoStore must be used within a DemoStoreProvider');
  }
  return ctx;
};

export default DemoStoreContext;
