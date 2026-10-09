import { DbResource, DbService, DbWorkingHours, DbScheduleException } from './database';

export interface TenantBranding {
  accentColor: string; // Hex color e.g. '#D4AF37' or '#E11D48'
  logoUrl: string;
  coverUrl: string;
  theme: 'dark' | 'luxury-dark' | 'industrial-dark';
  ogImageUrl?: string;
  appleTouchIcon?: string;
  favicon?: string;
}

export interface TenantBusinessConfig {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  currency: string; // 'RUB' | 'USD' | 'EUR'
  timezone: string; // 'Europe/Moscow'
  businessType: 'detailing' | 'service';
  isPreview?: boolean;
  branding: TenantBranding;
  resources: Array<Omit<DbResource, 'tenant_id' | 'created_at'>>;
  services: Array<Omit<DbService, 'tenant_id'>>;
  serviceResources: Array<{ serviceId: string; resourceId: string }>;
  workingHours: Array<Omit<DbWorkingHours, 'id' | 'tenant_id'>>;
  scheduleExceptions?: Array<Omit<DbScheduleException, 'id' | 'tenant_id'>>;
}
