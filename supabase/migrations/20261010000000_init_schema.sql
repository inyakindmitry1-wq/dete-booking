-- ==============================================================================
-- Migration: 20261010000000_init_schema.sql
-- Multi-Tenant Auto Service & Detailing PWA Schema
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  timezone TEXT NOT NULL DEFAULT 'Europe/Moscow',
  accent_color TEXT NOT NULL DEFAULT '#F59E0B',
  logo_url TEXT NOT NULL,
  cover_url TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('detailing', 'service')),
  is_preview BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Resources (Bays, Lifts, Stations)
CREATE TABLE IF NOT EXISTS resources (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('detailing_bay', 'hydraulic_lift', 'wash_bay', 'diagnostic_bay', 'station')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT uq_tenant_resource UNIQUE (tenant_id, id)
);

-- 4. Services
CREATE TABLE IF NOT EXISTS services (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  buffer_minutes INT NOT NULL DEFAULT 15 CHECK (buffer_minutes >= 0),
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT uq_tenant_service UNIQUE (tenant_id, id)
);

-- 5. Service-to-Resource Mappings
CREATE TABLE IF NOT EXISTS service_resources (
  service_id UUID NOT NULL,
  resource_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  PRIMARY KEY (service_id, resource_id),
  CONSTRAINT fk_sr_service FOREIGN KEY (tenant_id, service_id) REFERENCES services(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_sr_resource FOREIGN KEY (tenant_id, resource_id) REFERENCES resources(tenant_id, id) ON DELETE CASCADE
);

-- 6. Working Hours
CREATE TABLE IF NOT EXISTS working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT uq_tenant_day UNIQUE (tenant_id, day_of_week)
);

-- 7. Schedule Exceptions (Holidays, Modified Hours)
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT true,
  open_time TIME,
  close_time TIME,
  note TEXT,
  CONSTRAINT uq_tenant_exception_date UNIQUE (tenant_id, date)
);

-- 8. Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  car_model TEXT,
  car_plate TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_tenant_customer_phone UNIQUE (tenant_id, phone)
);

-- 9. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL,
  service_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'checked_in', 'completed', 'cancelled')),
  service_name_snapshot TEXT NOT NULL,
  price_snapshot NUMERIC(12, 2) NOT NULL,
  idempotency_key TEXT,
  access_token_hash TEXT,
  customer_notes TEXT,
  car_model TEXT,
  car_plate TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_tenant_idempotency UNIQUE (tenant_id, idempotency_key),
  CONSTRAINT fk_booking_resource FOREIGN KEY (tenant_id, resource_id) REFERENCES resources(tenant_id, id),
  CONSTRAINT fk_booking_service FOREIGN KEY (tenant_id, service_id) REFERENCES services(tenant_id, id)
);

-- 10. Unified Resource Occupancies with PostgreSQL EXCLUDE Constraint
-- Invariant 4: Continuous occupancy with EXCLUDE USING gist (resource_id WITH =, time_range WITH &&)
CREATE TABLE IF NOT EXISTS resource_occupancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  occupancy_type TEXT NOT NULL CHECK (occupancy_type IN ('booking', 'maintenance', 'manual_block')),
  time_range TSTZRANGE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_occupancy_resource FOREIGN KEY (tenant_id, resource_id) REFERENCES resources(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT no_overlapping_occupancy EXCLUDE USING gist (
    resource_id WITH =,
    time_range WITH &&
  )
);

-- 11. Payments (Recorded actual received funds, distinct from bookings)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'refunded')),
  note TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Tenant Members (Owner & Staff linked to Supabase Auth user_id)
CREATE TABLE IF NOT EXISTS tenant_members (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

-- 13. Notification Jobs (Transactional Outbox with Lease & Deduplication)
CREATE TABLE IF NOT EXISTS notification_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('web_push', 'sms', 'telegram')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ,
  worker_id TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  deduplication_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Rate Limits & LLM Spend Budgets
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INT NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_occupancies_timerange ON resource_occupancies USING gist (time_range);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_status ON bookings (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_access_token_hash ON bookings (access_token_hash);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings (start_time);
CREATE INDEX IF NOT EXISTS idx_notifications_pending ON notification_jobs (status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_payments_tenant_date ON payments (tenant_id, recorded_at);
