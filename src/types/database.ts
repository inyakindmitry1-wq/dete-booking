export type ResourceType = 'detailing_bay' | 'hydraulic_lift' | 'wash_bay' | 'diagnostic_bay' | 'station';

export type BookingStatus = 'confirmed' | 'checked_in' | 'completed' | 'cancelled';

export type OccupancyType = 'booking' | 'maintenance' | 'manual_block';

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface DbTenant {
  id: string;
  slug: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  currency: string;
  timezone: string;
  accent_color: string;
  logo_url: string;
  cover_url: string;
  business_type: 'detailing' | 'service';
  tagline: string;
  description: string;
  is_preview: boolean;
  created_at: string;
}

export interface DbResource {
  id: string;
  tenant_id: string;
  name: string;
  type: ResourceType;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface DbService {
  id: string;
  tenant_id: string;
  category: string;
  name: string;
  description: string;
  duration_minutes: number;
  buffer_minutes: number;
  price: number;
  is_active: boolean;
  image_url: string;
  sort_order: number;
}

export interface DbServiceResource {
  service_id: string;
  resource_id: string;
  tenant_id: string;
}

export interface DbWorkingHours {
  id: string;
  tenant_id: string;
  day_of_week: number; // 0 (Sun) - 6 (Sat)
  open_time: string; // '09:00:00'
  close_time: string; // '20:00:00'
  is_closed: boolean;
}

export interface DbScheduleException {
  id: string;
  tenant_id: string;
  date: string; // 'YYYY-MM-DD'
  is_closed: boolean;
  open_time?: string;
  close_time?: string;
  note?: string;
}

export interface DbResourceOccupancy {
  id: string;
  tenant_id: string;
  resource_id: string;
  booking_id?: string;
  occupancy_type: OccupancyType;
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  note?: string;
  created_at: string;
}

export interface DbCustomer {
  id: string;
  tenant_id: string;
  phone: string;
  name: string;
  email?: string;
  car_model?: string;
  car_plate?: string;
  notes?: string;
  created_at: string;
}

export interface DbBooking {
  id: string;
  tenant_id: string;
  resource_id: string;
  service_id: string;
  customer_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: BookingStatus;
  service_name_snapshot: string;
  price_snapshot: number;
  idempotency_key?: string;
  access_token_hash?: string;
  customer_notes?: string;
  car_model?: string;
  car_plate?: string;
  created_at: string;
  updated_at: string;
  // Joined relation fields
  customer?: DbCustomer;
  service?: DbService;
  resource?: DbResource;
}

export interface DbPayment {
  id: string;
  tenant_id: string;
  booking_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: 'paid' | 'refunded';
  recorded_at: string;
  note?: string;
}

export interface DbTenantMember {
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'staff';
  created_at: string;
}

export interface DbNotificationJob {
  id: string;
  tenant_id: string;
  booking_id: string;
  channel: 'web_push' | 'sms' | 'telegram';
  payload: Record<string, unknown>;
  status: NotificationStatus;
  scheduled_for: string;
  locked_until?: string;
  worker_id?: string;
  retry_count: number;
  deduplication_key: string;
  created_at: string;
}

export interface TimeSlot {
  time: string; // ISO string
  display_time: string; // '10:00'
  available_resource_id: string;
  is_available: boolean;
}

export interface CreateBookingRequest {
  tenant_slug: string;
  service_id: string;
  start_time: string; // ISO
  customer_name: string;
  customer_phone: string;
  car_model?: string;
  car_plate?: string;
  customer_notes?: string;
  idempotency_key: string;
}

export interface CreateBookingResponse {
  booking_id: string;
  access_token: string;
  start_time: string;
  end_time: string;
  service_name: string;
  price: number;
  resource_name: string;
  status: BookingStatus;
}
