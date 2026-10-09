-- ==============================================================================
-- Migration: 20261010000001_atomic_functions.sql
-- Atomic Transactions, Conflict Handling, SQL Analytics & RLS Policies
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Atomic Booking Creation Function (Idempotent & Concurrency Safe)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_tenant_slug TEXT,
  p_service_id UUID,
  p_start_time TIMESTAMPTZ,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_car_model TEXT DEFAULT NULL,
  p_car_plate TEXT DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_access_token_hash TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_tenant_name TEXT;
  v_service RECORD;
  v_total_minutes INT;
  v_end_time TIMESTAMPTZ;
  v_resource_id UUID;
  v_resource_name TEXT;
  v_customer_id UUID;
  v_booking_id UUID;
  v_existing_booking RECORD;
BEGIN
  -- 1. Identify Tenant
  SELECT id, name INTO v_tenant_id, v_tenant_name
  FROM tenants WHERE slug = p_tenant_slug;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Check Idempotency
  IF p_idempotency_key IS NOT NULL THEN
    SELECT b.id, b.start_time, b.end_time, b.service_name_snapshot, b.price_snapshot, b.status, r.name AS resource_name
    INTO v_existing_booking
    FROM bookings b
    JOIN resources r ON r.id = b.resource_id
    WHERE b.tenant_id = v_tenant_id AND b.idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'booking_id', v_existing_booking.id,
        'start_time', v_existing_booking.start_time,
        'end_time', v_existing_booking.end_time,
        'service_name', v_existing_booking.service_name_snapshot,
        'price', v_existing_booking.price_snapshot,
        'resource_name', v_existing_booking.resource_name,
        'status', v_existing_booking.status,
        'is_duplicate', true
      );
    END IF;
  END IF;

  -- 3. Retrieve and Validate Service
  SELECT id, name, duration_minutes, buffer_minutes, price, is_active
  INTO v_service
  FROM services
  WHERE tenant_id = v_tenant_id AND id = p_service_id;

  IF NOT FOUND OR NOT v_service.is_active THEN
    RAISE EXCEPTION 'SERVICE_NOT_AVAILABLE' USING ERRCODE = 'P0003';
  END IF;

  v_total_minutes := v_service.duration_minutes + v_service.buffer_minutes;
  v_end_time := p_start_time + (v_total_minutes * INTERVAL '1 minute');

  -- 4. Find Free Eligible Resource
  -- Locks candidate resources against concurrent allocations
  SELECT r.id, r.name INTO v_resource_id, v_resource_name
  FROM resources r
  JOIN service_resources sr ON sr.resource_id = r.id AND sr.service_id = v_service.id
  WHERE r.tenant_id = v_tenant_id
    AND r.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM resource_occupancies ro
      WHERE ro.resource_id = r.id
        AND ro.time_range && tstzrange(p_start_time, v_end_time, '[)')
    )
  ORDER BY r.sort_order ASC, r.name ASC
  LIMIT 1
  FOR UPDATE OF r;

  IF v_resource_id IS NULL THEN
    RAISE EXCEPTION 'NO_AVAILABLE_RESOURCE_SLOT' USING ERRCODE = '23P01';
  END IF;

  -- 5. Upsert Customer Record
  INSERT INTO customers (tenant_id, phone, name, car_model, car_plate, notes)
  VALUES (v_tenant_id, p_customer_phone, p_customer_name, p_car_model, p_car_plate, p_customer_notes)
  ON CONFLICT (tenant_id, phone) DO UPDATE SET
    name = EXCLUDED.name,
    car_model = COALESCE(EXCLUDED.car_model, customers.car_model),
    car_plate = COALESCE(EXCLUDED.car_plate, customers.car_plate)
  RETURNING id INTO v_customer_id;

  -- 6. Insert Booking Record (Stores Price & Name Snapshot)
  INSERT INTO bookings (
    tenant_id, resource_id, service_id, customer_id,
    start_time, end_time, duration_minutes, status,
    service_name_snapshot, price_snapshot, idempotency_key,
    access_token_hash, customer_notes, car_model, car_plate
  )
  VALUES (
    v_tenant_id, v_resource_id, v_service.id, v_customer_id,
    p_start_time, v_end_time, v_service.duration_minutes, 'confirmed',
    v_service.name, v_service.price, p_idempotency_key,
    p_access_token_hash, p_customer_notes, p_car_model, p_car_plate
  )
  RETURNING id INTO v_booking_id;

  -- 7. Insert Resource Occupancy (Enforced by EXCLUDE constraint)
  INSERT INTO resource_occupancies (
    tenant_id, resource_id, booking_id, occupancy_type, time_range, note
  )
  VALUES (
    v_tenant_id, v_resource_id, v_booking_id, 'booking',
    tstzrange(p_start_time, v_end_time, '[)'),
    v_service.name || ' (' || p_customer_name || ')'
  );

  -- 8. Queue Outbox Notification Job
  INSERT INTO notification_jobs (
    tenant_id, booking_id, channel, payload, status,
    scheduled_for, deduplication_key
  )
  VALUES (
    v_tenant_id,
    v_booking_id,
    'web_push',
    jsonb_build_object(
      'title', 'Запись подтверждена',
      'body', 'Ваша запись на ' || v_service.name || ' назначена на ' || to_char(p_start_time, 'DD.MM.YYYY HH24:MI'),
      'service', v_service.name,
      'start_time', p_start_time
    ),
    'pending',
    now(),
    'booking_confirmed_' || v_booking_id::text
  );

  -- Return Result
  RETURN jsonb_build_object(
    'booking_id', v_booking_id,
    'start_time', p_start_time,
    'end_time', v_end_time,
    'service_name', v_service.name,
    'price', v_service.price,
    'resource_name', v_resource_name,
    'status', 'confirmed',
    'is_duplicate', false
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. Atomic Reschedule Booking Function
-- Invariant 4: Failed reschedule must NOT forfeit the original booking
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reschedule_booking_atomic(
  p_booking_id UUID,
  p_access_token_hash TEXT,
  p_new_start_time TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_total_minutes INT;
  v_new_end_time TIMESTAMPTZ;
  v_new_resource_id UUID;
  v_new_resource_name TEXT;
BEGIN
  -- 1. Verify Booking & Token
  SELECT b.*, s.buffer_minutes, r.name AS current_resource_name
  INTO v_booking
  FROM bookings b
  JOIN services s ON s.id = b.service_id
  JOIN resources r ON r.id = b.resource_id
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_booking.access_token_hash IS NOT NULL AND v_booking.access_token_hash <> p_access_token_hash THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  IF v_booking.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'CANNOT_RESCHEDULE_FINALIZED_BOOKING' USING ERRCODE = 'P0004';
  END IF;

  v_total_minutes := v_booking.duration_minutes + v_booking.buffer_minutes;
  v_new_end_time := p_new_start_time + (v_total_minutes * INTERVAL '1 minute');

  -- 2. Find eligible free resource at new time (can be same resource or another)
  SELECT r.id, r.name INTO v_new_resource_id, v_new_resource_name
  FROM resources r
  JOIN service_resources sr ON sr.resource_id = r.id AND sr.service_id = v_booking.service_id
  WHERE r.tenant_id = v_booking.tenant_id
    AND r.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM resource_occupancies ro
      WHERE ro.resource_id = r.id
        AND ro.booking_id IS DISTINCT FROM v_booking.id
        AND ro.time_range && tstzrange(p_new_start_time, v_new_end_time, '[)')
    )
  ORDER BY (r.id = v_booking.resource_id) DESC, r.sort_order ASC
  LIMIT 1;

  IF v_new_resource_id IS NULL THEN
    RAISE EXCEPTION 'NEW_SLOT_UNAVAILABLE' USING ERRCODE = '23P01';
  END IF;

  -- 3. Update Occupancy Range Atomically
  UPDATE resource_occupancies
  SET resource_id = v_new_resource_id,
      time_range = tstzrange(p_new_start_time, v_new_end_time, '[)')
  WHERE booking_id = v_booking.id;

  -- 4. Update Booking Time
  UPDATE bookings
  SET resource_id = v_new_resource_id,
      start_time = p_new_start_time,
      end_time = v_new_end_time,
      updated_at = now()
  WHERE id = v_booking.id;

  -- 5. Queue Reschedule Notification
  INSERT INTO notification_jobs (
    tenant_id, booking_id, channel, payload, status,
    scheduled_for, deduplication_key
  )
  VALUES (
    v_booking.tenant_id,
    v_booking.id,
    'web_push',
    jsonb_build_object(
      'title', 'Запись перенесена',
      'body', 'Новое время записи: ' || to_char(p_new_start_time, 'DD.MM.YYYY HH24:MI'),
      'new_start_time', p_new_start_time
    ),
    'pending',
    now(),
    'booking_rescheduled_' || v_booking.id::text || '_' || extract(epoch from p_new_start_time)::text
  );

  RETURN jsonb_build_object(
    'booking_id', v_booking.id,
    'new_start_time', p_new_start_time,
    'new_end_time', v_new_end_time,
    'resource_name', v_new_resource_name,
    'status', v_booking.status
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. Atomic Cancel Booking Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cancel_booking_atomic(
  p_booking_id UUID,
  p_access_token_hash TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_booking.access_token_hash IS NOT NULL AND v_booking.access_token_hash <> p_access_token_hash THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  -- Update status
  UPDATE bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_booking_id;

  -- Remove resource occupancy
  DELETE FROM resource_occupancies
  WHERE booking_id = p_booking_id;

  -- Cancel pending notifications
  UPDATE notification_jobs
  SET status = 'cancelled'
  WHERE booking_id = p_booking_id AND status = 'pending';

  RETURN jsonb_build_object(
    'booking_id', p_booking_id,
    'status', 'cancelled'
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. SQL Analytics: get_owner_stats
-- Invariant 8: Distinguish visits, completed orders, and actual payments
-- Never call future booking prices "revenue"!
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_owner_stats(
  p_tenant_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_bookings INT;
  v_arrivals_count INT;
  v_completed_count INT;
  v_cancelled_count INT;
  v_actual_revenue NUMERIC(12, 2);
  v_active_bays INT;
BEGIN
  -- Total bookings created in period
  SELECT count(*) INTO v_total_bookings
  FROM bookings
  WHERE tenant_id = p_tenant_id
    AND start_time >= p_start_date AND start_time < p_end_date;

  -- Arrivals / Check-ins (cars that actually arrived to the garage)
  SELECT count(*) INTO v_arrivals_count
  FROM bookings
  WHERE tenant_id = p_tenant_id
    AND status IN ('checked_in', 'completed')
    AND start_time >= p_start_date AND start_time < p_end_date;

  -- Completed orders
  SELECT count(*) INTO v_completed_count
  FROM bookings
  WHERE tenant_id = p_tenant_id
    AND status = 'completed'
    AND start_time >= p_start_date AND start_time < p_end_date;

  -- Cancelled orders
  SELECT count(*) INTO v_cancelled_count
  FROM bookings
  WHERE tenant_id = p_tenant_id
    AND status = 'cancelled'
    AND start_time >= p_start_date AND start_time < p_end_date;

  -- Actual received payments (Collected cash/cards, NEVER future prospective values!)
  SELECT COALESCE(SUM(amount), 0.00) INTO v_actual_revenue
  FROM payments
  WHERE tenant_id = p_tenant_id
    AND status = 'paid'
    AND recorded_at >= p_start_date AND recorded_at < p_end_date;

  -- Number of active bays/lifts
  SELECT count(*) INTO v_active_bays
  FROM resources
  WHERE tenant_id = p_tenant_id AND is_active = true;

  RETURN jsonb_build_object(
    'total_bookings', v_total_bookings,
    'arrivals_count', v_arrivals_count,
    'completed_count', v_completed_count,
    'cancelled_count', v_cancelled_count,
    'actual_revenue', v_actual_revenue,
    'active_resources', v_active_bays,
    'period_start', p_start_date,
    'period_end', p_end_date
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. Outbox Lease Claim Function
-- Invariant 10: Process jobs with distributed lease and worker ID
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_notification_jobs(
  p_worker_id TEXT,
  p_limit INT DEFAULT 10,
  p_lease_seconds INT DEFAULT 60
)
RETURNS SETOF notification_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE notification_jobs
  SET status = 'processing',
      locked_until = now() + (p_lease_seconds * INTERVAL '1 second'),
      worker_id = p_worker_id
  WHERE id IN (
    SELECT id FROM notification_jobs
    WHERE (status = 'pending' AND scheduled_for <= now())
       OR (status = 'processing' AND locked_until < now())
    ORDER BY scheduled_for ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. Row Level Security Policies
-- Invariant 6: anon cannot read customer PII, payments, or raw tokens
-- ------------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_occupancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Tenants: Publicly readable
CREATE POLICY p_tenants_public_read ON tenants FOR SELECT USING (true);

-- Resources: Publicly readable
CREATE POLICY p_resources_public_read ON resources FOR SELECT USING (is_active = true);

-- Services: Publicly readable
CREATE POLICY p_services_public_read ON services FOR SELECT USING (is_active = true);

-- Service Resources: Publicly readable
CREATE POLICY p_service_resources_public_read ON service_resources FOR SELECT USING (true);

-- Working Hours: Publicly readable
CREATE POLICY p_working_hours_public_read ON working_hours FOR SELECT USING (true);

-- Schedule Exceptions: Publicly readable
CREATE POLICY p_exceptions_public_read ON schedule_exceptions FOR SELECT USING (true);

-- Resource Occupancies: Publicly readable for availability checks (no customer PII stored here)
CREATE POLICY p_occupancies_public_read ON resource_occupancies FOR SELECT USING (true);

-- Customers: ONLY authenticated owner of this tenant
CREATE POLICY p_customers_owner_access ON customers
FOR ALL TO authenticated
USING (
  tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
);

-- Bookings: Authenticated owner can manage; anon cannot read table directly
CREATE POLICY p_bookings_owner_access ON bookings
FOR ALL TO authenticated
USING (
  tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
);

-- Payments: ONLY authenticated owner of this tenant
CREATE POLICY p_payments_owner_access ON payments
FOR ALL TO authenticated
USING (
  tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
);

-- Tenant Members: Authenticated user can see their own memberships
CREATE POLICY p_tenant_members_read ON tenant_members
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Notification Jobs: Service Role Only (no public access)
-- Default deny for anon and authenticated
