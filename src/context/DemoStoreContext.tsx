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

interface DemoStoreContextValue {
  studio: StudioPreset;
  allStudios: StudioPreset[];
  services: ServiceItem[];
  upsellOffer: UpsellOffer;
  switchStudio: (slug: string) => void;
  resetToDefaults: () => void;
  updateServicePrice: (
    serviceId: string,
    carClass: 'class_1_sedan' | 'class_2_suv' | 'class_3_xl',
    price: number
  ) => void;
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

  return (
    <DemoStoreContext.Provider
      value={{
        studio: activeStudio,
        allStudios: getAllStudios(),
        services,
        upsellOffer,
        switchStudio,
        resetToDefaults,
        updateServicePrice,
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
