import { z } from 'zod';

export const TenantBrandingSchema = z.object({
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color code'),
  logoUrl: z.string().min(1, 'Logo URL is required'),
  coverUrl: z.string().min(1, 'Cover URL is required'),
  theme: z.enum(['dark', 'luxury-dark', 'industrial-dark']).default('dark'),
  ogImageUrl: z.string().optional(),
  appleTouchIcon: z.string().optional(),
  favicon: z.string().optional(),
});

export const TenantResourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Resource name is required'),
  type: z.enum(['detailing_bay', 'hydraulic_lift', 'wash_bay', 'diagnostic_bay', 'station']),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const TenantServiceSchema = z.object({
  id: z.string().uuid(),
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Service name is required'),
  description: z.string().min(1, 'Description is required'),
  duration_minutes: z.number().int().positive('Duration must be positive'),
  buffer_minutes: z.number().int().nonnegative('Buffer must be non-negative').default(15),
  price: z.number().nonnegative('Price must be non-negative'),
  is_active: z.boolean().default(true),
  image_url: z.string().min(1, 'Image URL is required'),
  sort_order: z.number().int().default(0),
});

export const TenantServiceResourceSchema = z.object({
  serviceId: z.string().uuid(),
  resourceId: z.string().uuid(),
});

export const TenantWorkingHoursSchema = z.object({
  day_of_week: z.number().int().min(0).max(6), // 0: Sunday, 1: Monday, ... 6: Saturday
  open_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Format HH:MM or HH:MM:SS'),
  close_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Format HH:MM or HH:MM:SS'),
  is_closed: z.boolean().default(false),
});

export const TenantScheduleExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD'),
  is_closed: z.boolean().default(true),
  open_time: z.string().optional(),
  close_time: z.string().optional(),
  note: z.string().optional(),
});

export const BusinessConfigSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must consist only of lowercase letters, digits, and hyphens'),
  name: z.string().min(2, 'Business name must have at least 2 characters'),
  tagline: z.string().min(3),
  description: z.string().min(10),
  phone: z.string().min(5),
  address: z.string().min(5),
  city: z.string().min(2),
  currency: z.enum(['RUB', 'USD', 'EUR']).default('RUB'),
  timezone: z.string().default('Europe/Moscow'),
  businessType: z.enum(['detailing', 'service']),
  isPreview: z.boolean().default(false),
  branding: TenantBrandingSchema,
  resources: z.array(TenantResourceSchema).min(1, 'Must have at least one resource'),
  services: z.array(TenantServiceSchema).min(1, 'Must have at least one service'),
  serviceResources: z.array(TenantServiceResourceSchema).min(1, 'Must map at least one service to resource'),
  workingHours: z.array(TenantWorkingHoursSchema).length(7, 'Must specify working hours for all 7 days of week (0 to 6)'),
  scheduleExceptions: z.array(TenantScheduleExceptionSchema).optional().default([]),
});

export type BusinessConfig = z.infer<typeof BusinessConfigSchema>;
