import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialServices, initialUpsellOffer, ServiceItem, UpsellOffer } from '../data/initialState';
import { studioConfig, StudioConfig } from '../config/studio.config';

const STORAGE_KEY = `detailing_demo_${studioConfig.slug}_v1`;

interface DemoStoreContextValue {
  config: StudioConfig;
  services: ServiceItem[];
  upsellOffer: UpsellOffer;
  resetToDefaults: () => void;
  updateServicePrice: (serviceId: string, carClass: 'class_1_sedan' | 'class_2_suv' | 'class_3_xl', price: number) => void;
}

const DemoStoreContext = createContext<DemoStoreContextValue | undefined>(undefined);

export const DemoStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<ServiceItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.services && Array.isArray(parsed.services)) {
          return parsed.services;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored demo store:', e);
    }
    return initialServices;
  });

  const [upsellOffer] = useState<UpsellOffer>(initialUpsellOffer);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ services, upsellOffer }));
    } catch (e) {
      console.warn('Failed to persist demo store:', e);
    }
  }, [services, upsellOffer]);

  const resetToDefaults = () => {
    setServices(initialServices);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  const updateServicePrice = (
    serviceId: string,
    carClass: 'class_1_sedan' | 'class_2_suv' | 'class_3_xl',
    price: number
  ) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, prices: { ...s.prices, [carClass]: price } } : s))
    );
  };

  return (
    <DemoStoreContext.Provider
      value={{
        config: studioConfig,
        services,
        upsellOffer,
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
