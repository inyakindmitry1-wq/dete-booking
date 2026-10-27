import { DbTenant, DbResource, DbService, DbServiceResource, DbWorkingHours, DbScheduleException, DbResourceOccupancy, DbCustomer, DbBooking, DbPayment, DbTenantMember, DbNotificationJob } from '@/types/database';
import sokolJson from '../../tenants/sokol/business.json';
import graphiteJson from '../../tenants/graphite/business.json';
import apexJson from '../../tenants/apex/business.json';

interface DatabaseState {
  tenants: DbTenant[];
  resources: DbResource[];
  services: DbService[];
  service_resources: DbServiceResource[];
  working_hours: DbWorkingHours[];
  schedule_exceptions: DbScheduleException[];
  resource_occupancies: DbResourceOccupancy[];
  customers: DbCustomer[];
  bookings: DbBooking[];
  payments: DbPayment[];
  tenant_members: DbTenantMember[];
  notification_jobs: DbNotificationJob[];
}

function loadInitialState(): DatabaseState {
  const tenants: DbTenant[] = [];
  const resources: DbResource[] = [];
  const services: DbService[] = [];
  const service_resources: DbServiceResource[] = [];
  const working_hours: DbWorkingHours[] = [];
  const schedule_exceptions: DbScheduleException[] = [];
  const resource_occupancies: DbResourceOccupancy[] = [];
  const customers: DbCustomer[] = [];
  const bookings: DbBooking[] = [];
  const payments: DbPayment[] = [];
  const tenant_members: DbTenantMember[] = [];
  const notification_jobs: DbNotificationJob[] = [];

  const rawConfigs = [sokolJson, graphiteJson, apexJson];

  for (const cfg of rawConfigs) {
    const tenantId = `tenant-${cfg.slug}`;

    tenants.push({
      id: tenantId,
      slug: cfg.slug,
      name: cfg.name,
      phone: cfg.phone,
      address: cfg.address,
      city: cfg.city,
      currency: cfg.currency,
      timezone: cfg.timezone,
      accent_color: cfg.branding.accentColor,
      logo_url: cfg.branding.logoUrl,
      cover_url: cfg.branding.coverUrl,
      business_type: cfg.businessType as 'detailing' | 'service',
      tagline: cfg.tagline,
      description: cfg.description,
      is_preview: Boolean(cfg.isPreview),
      created_at: new Date().toISOString(),
    });

    for (const r of cfg.resources) {
      resources.push({
        ...r,
        tenant_id: tenantId,
        type: r.type as any,
        created_at: new Date().toISOString(),
      });
    }

    for (const s of cfg.services) {
      services.push({
        ...s,
        tenant_id: tenantId,
      });
    }

    for (const sr of cfg.serviceResources) {
      service_resources.push({
        service_id: sr.serviceId,
        resource_id: sr.resourceId,
        tenant_id: tenantId,
      });
    }

    for (const wh of cfg.workingHours) {
      working_hours.push({
        id: `wh-${tenantId}-${wh.day_of_week}`,
        tenant_id: tenantId,
        day_of_week: wh.day_of_week,
        open_time: wh.open_time,
        close_time: wh.close_time,
        is_closed: wh.is_closed,
      });
    }
  }

  // Pre-seed owner membership for demo testing (e.g. owner_user_id)
  tenant_members.push({
    tenant_id: 'tenant-sokol',
    user_id: 'owner-sokol-user-id',
    role: 'owner',
    created_at: new Date().toISOString(),
  });
  tenant_members.push({
    tenant_id: 'tenant-graphite',
    user_id: 'owner-graphite-user-id',
    role: 'owner',
    created_at: new Date().toISOString(),
  });
  tenant_members.push({
    tenant_id: 'tenant-apex',
    user_id: 'owner-apex-user-id',
    role: 'owner',
    created_at: new Date().toISOString(),
  });

  return {
    tenants,
    resources,
    services,
    service_resources,
    working_hours,
    schedule_exceptions,
    resource_occupancies,
    customers,
    bookings,
    payments,
    tenant_members,
    notification_jobs,
  };
}

class MockDatabase {
  private state: DatabaseState;
  private storageKey = 'dete_pwa_mock_db_v6';

  constructor() {
    this.state = this.loadFromStorage() || loadInitialState();
  }

  private loadFromStorage(): DatabaseState | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      // Clear legacy cache keys
      window.localStorage.removeItem('detailing_mock_db_v1');
      window.localStorage.removeItem('dete_pwa_mock_db_v1');
      window.localStorage.removeItem('dete_pwa_mock_db_v2');
      window.localStorage.removeItem('dete_pwa_mock_db_v3');
      window.localStorage.removeItem('dete_pwa_mock_db_v4');
      window.localStorage.removeItem('dete_pwa_mock_db_v5');

      const saved = window.localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const fresh = loadInitialState();
        // Always sync configuration definitions from business.json!
        return {
          ...parsed,
          tenants: fresh.tenants,
          services: fresh.services,
          service_resources: fresh.service_resources,
          resources: fresh.resources,
          working_hours: fresh.working_hours,
          tenant_members: fresh.tenant_members,
        };
      }
    } catch {
      // ignore
    }
    return null;
  }

  public saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      } catch {
        // ignore
      }
    }
  }

  public reset(): void {
    this.state = loadInitialState();
    this.saveToStorage();
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public getTenantBySlug(slug: string): DbTenant | undefined {
    if (slug === 'sokol' || slug === 'sokol-team') {
      const found = this.state.tenants.find((t) => t.slug === 'sokol');
      if (found) return found;
      return this.state.tenants.find((t) => t.slug === 'graphite');
    }
    return this.state.tenants.find((t) => t.slug === slug);
  }

  public getTenantResources(tenantId: string): DbResource[] {
    return this.state.resources
      .filter((r) => r.tenant_id === tenantId && r.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  public getTenantServices(tenantId: string): DbService[] {
    return this.state.services
      .filter((s) => s.tenant_id === tenantId && s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  public getServiceResources(tenantId: string, serviceId: string): string[] {
    return this.state.service_resources
      .filter((sr) => sr.tenant_id === tenantId && sr.service_id === serviceId)
      .map((sr) => sr.resource_id);
  }

  public getWorkingHours(tenantId: string): DbWorkingHours[] {
    return this.state.working_hours.filter((wh) => wh.tenant_id === tenantId);
  }

  public getScheduleExceptions(tenantId: string): DbScheduleException[] {
    return this.state.schedule_exceptions.filter((se) => se.tenant_id === tenantId);
  }

  public getResourceOccupancies(tenantId: string): DbResourceOccupancy[] {
    return this.state.resource_occupancies.filter((ro) => ro.tenant_id === tenantId);
  }

  /**
   * Atomic check for interval overlap:
   * Returns true if [start, end) conflicts with any existing occupancy on resource_id
   */
  public hasConflict(
    resourceId: string,
    startIso: string,
    endIso: string,
    excludeBookingId?: string
  ): boolean {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();

    return this.state.resource_occupancies.some((occ) => {
      if (occ.resource_id !== resourceId) return false;
      if (excludeBookingId && occ.booking_id === excludeBookingId) return false;

      const occStart = new Date(occ.start_time).getTime();
      const occEnd = new Date(occ.end_time).getTime();

      return start < occEnd && occStart < end;
    });
  }

  /**
   * Atomic booking creation matching create_booking_atomic SQL
   */
  public createBookingAtomic(params: {
    tenant_slug: string;
    service_id: string;
    start_time: string;
    customer_name: string;
    customer_phone: string;
    car_model?: string;
    car_plate?: string;
    customer_notes?: string;
    idempotency_key?: string;
    access_token_hash?: string;
  }) {
    const tenant = this.getTenantBySlug(params.tenant_slug);
    if (!tenant) throw new Error('TENANT_NOT_FOUND');

    // 1. Idempotency check
    if (params.idempotency_key) {
      const existing = this.state.bookings.find(
        (b) => b.tenant_id === tenant.id && b.idempotency_key === params.idempotency_key
      );
      if (existing) {
        const resource = this.state.resources.find((r) => r.id === existing.resource_id);
        return {
          booking_id: existing.id,
          start_time: existing.start_time,
          end_time: existing.end_time,
          service_name: existing.service_name_snapshot,
          price: existing.price_snapshot,
          resource_name: resource?.name || 'Пост',
          status: existing.status,
          is_duplicate: true,
        };
      }
    }

    // 2. Service check
    const service = this.state.services.find(
      (s) => s.tenant_id === tenant.id && s.id === params.service_id && s.is_active
    );
    if (!service) throw new Error('SERVICE_NOT_AVAILABLE');

    const totalMinutes = service.duration_minutes + service.buffer_minutes;
    const start = new Date(params.start_time);
    const end = new Date(start.getTime() + totalMinutes * 60 * 1000);
    const endIso = end.toISOString();

    // 3. Find free eligible resource
    const eligibleResourceIds = this.getServiceResources(tenant.id, service.id);
    let chosenResource: DbResource | null = null;

    for (const resId of eligibleResourceIds) {
      if (!this.hasConflict(resId, params.start_time, endIso)) {
        chosenResource = this.state.resources.find((r) => r.id === resId) || null;
        if (chosenResource) break;
      }
    }

    if (!chosenResource) {
      throw new Error('NO_AVAILABLE_RESOURCE_SLOT');
    }

    // 4. Upsert Customer
    let customer = this.state.customers.find(
      (c) => c.tenant_id === tenant.id && c.phone === params.customer_phone
    );
    if (!customer) {
      customer = {
        id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tenant_id: tenant.id,
        phone: params.customer_phone,
        name: params.customer_name,
        car_model: params.car_model,
        car_plate: params.car_plate,
        notes: params.customer_notes,
        created_at: new Date().toISOString(),
      };
      this.state.customers.push(customer);
    } else {
      customer.name = params.customer_name;
      if (params.car_model) customer.car_model = params.car_model;
      if (params.car_plate) customer.car_plate = params.car_plate;
    }

    // 5. Create Booking
    const bookingId = `book-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newBooking: DbBooking = {
      id: bookingId,
      tenant_id: tenant.id,
      resource_id: chosenResource.id,
      service_id: service.id,
      customer_id: customer.id,
      start_time: params.start_time,
      end_time: endIso,
      duration_minutes: service.duration_minutes,
      status: 'confirmed',
      service_name_snapshot: service.name,
      price_snapshot: service.price,
      idempotency_key: params.idempotency_key,
      access_token_hash: params.access_token_hash,
      customer_notes: params.customer_notes,
      car_model: params.car_model,
      car_plate: params.car_plate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.bookings.push(newBooking);

    // 6. Create Resource Occupancy (Simulating EXCLUDE)
    const occId = `occ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.state.resource_occupancies.push({
      id: occId,
      tenant_id: tenant.id,
      resource_id: chosenResource.id,
      booking_id: bookingId,
      occupancy_type: 'booking',
      start_time: params.start_time,
      end_time: endIso,
      note: `${service.name} (${params.customer_name})`,
      created_at: new Date().toISOString(),
    });

    // 7. Enqueue Notification Job
    this.state.notification_jobs.push({
      id: `job-${Date.now()}`,
      tenant_id: tenant.id,
      booking_id: bookingId,
      channel: 'web_push',
      payload: {
        title: 'Запись подтверждена',
        body: `Ваша запись на ${service.name} назначена на ${start.toLocaleString('ru-RU')}`,
      },
      status: 'pending',
      scheduled_for: new Date().toISOString(),
      retry_count: 0,
      deduplication_key: `booking_confirmed_${bookingId}`,
      created_at: new Date().toISOString(),
    });

    this.saveToStorage();

    return {
      booking_id: bookingId,
      start_time: params.start_time,
      end_time: endIso,
      service_name: service.name,
      price: service.price,
      resource_name: chosenResource.name,
      status: 'confirmed' as const,
      is_duplicate: false,
    };
  }

  /**
   * Atomic rescheduling matching reschedule_booking_atomic SQL
   */
  public rescheduleBookingAtomic(bookingId: string, tokenHash: string, newStartTimeIso: string) {
    const booking = this.state.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('BOOKING_NOT_FOUND');

    if (booking.access_token_hash && booking.access_token_hash !== tokenHash) {
      throw new Error('UNAUTHORIZED');
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new Error('CANNOT_RESCHEDULE_FINALIZED_BOOKING');
    }

    const service = this.state.services.find((s) => s.id === booking.service_id);
    const buffer = service ? service.buffer_minutes : 15;
    const totalMinutes = booking.duration_minutes + buffer;
    const newStart = new Date(newStartTimeIso);
    const newEnd = new Date(newStart.getTime() + totalMinutes * 60 * 1000);
    const newEndIso = newEnd.toISOString();

    const eligibleResourceIds = this.getServiceResources(booking.tenant_id, booking.service_id);
    let chosenResourceId: string | null = null;

    // Check if current resource or another is free
    for (const resId of [booking.resource_id, ...eligibleResourceIds]) {
      if (!this.hasConflict(resId, newStartTimeIso, newEndIso, booking.id)) {
        chosenResourceId = resId;
        break;
      }
    }

    if (!chosenResourceId) {
      throw new Error('NEW_SLOT_UNAVAILABLE');
    }

    // Atomic update
    booking.resource_id = chosenResourceId;
    booking.start_time = newStartTimeIso;
    booking.end_time = newEndIso;
    booking.updated_at = new Date().toISOString();

    const occupancy = this.state.resource_occupancies.find((ro) => ro.booking_id === booking.id);
    if (occupancy) {
      occupancy.resource_id = chosenResourceId;
      occupancy.start_time = newStartTimeIso;
      occupancy.end_time = newEndIso;
    }

    this.saveToStorage();

    const resource = this.state.resources.find((r) => r.id === chosenResourceId);
    return {
      booking_id: booking.id,
      new_start_time: newStartTimeIso,
      new_end_time: newEndIso,
      resource_name: resource?.name || 'Пост',
      status: booking.status,
    };
  }

  /**
   * Atomic cancellation matching cancel_booking_atomic SQL
   */
  public cancelBookingAtomic(bookingId: string, tokenHash?: string) {
    const booking = this.state.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('BOOKING_NOT_FOUND');

    if (tokenHash && booking.access_token_hash && booking.access_token_hash !== tokenHash) {
      throw new Error('UNAUTHORIZED');
    }

    booking.status = 'cancelled';
    booking.updated_at = new Date().toISOString();

    // Release occupancy
    this.state.resource_occupancies = this.state.resource_occupancies.filter(
      (ro) => ro.booking_id !== bookingId
    );

    // Cancel pending notification jobs
    for (const job of this.state.notification_jobs) {
      if (job.booking_id === bookingId && job.status === 'pending') {
        job.status = 'cancelled';
      }
    }

    this.saveToStorage();
    return { booking_id: bookingId, status: 'cancelled' };
  }

  /**
   * Manual bay lock (maintenance, offline booking)
   */
  public createManualBlock(params: {
    tenant_id: string;
    resource_id: string;
    start_time: string;
    end_time: string;
    note: string;
  }) {
    if (this.hasConflict(params.resource_id, params.start_time, params.end_time)) {
      throw new Error('RESOURCE_CONFLICT');
    }

    const blockId = `block-${Date.now()}`;
    const occ: DbResourceOccupancy = {
      id: blockId,
      tenant_id: params.tenant_id,
      resource_id: params.resource_id,
      occupancy_type: 'manual_block',
      start_time: params.start_time,
      end_time: params.end_time,
      note: params.note,
      created_at: new Date().toISOString(),
    };
    this.state.resource_occupancies.push(occ);
    this.saveToStorage();
    return occ;
  }

  /**
   * Record payment for a booking
   */
  public recordPayment(params: {
    tenant_id: string;
    booking_id: string;
    amount: number;
    payment_method: 'cash' | 'card' | 'transfer';
    recorded_at?: string;
    note?: string;
  }) {
    const payment: DbPayment = {
      id: `pay-${Date.now()}`,
      tenant_id: params.tenant_id,
      booking_id: params.booking_id,
      amount: params.amount,
      payment_method: params.payment_method,
      status: 'paid',
      recorded_at: params.recorded_at || new Date().toISOString(),
      note: params.note,
    };
    this.state.payments.push(payment);
    this.saveToStorage();
    return payment;
  }

  /**
   * Update booking status
   */
  public updateBookingStatus(bookingId: string, status: DbBooking['status']) {
    const booking = this.state.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    booking.status = status;
    booking.updated_at = new Date().toISOString();
    this.saveToStorage();
    return booking;
  }

  /**
   * Pure SQL statistics calculation matching get_owner_stats SQL
   */
  public getOwnerStats(tenantId: string, startDateIso: string, endDateIso: string) {
    const start = new Date(startDateIso).getTime();
    const end = new Date(endDateIso).getTime();

    const tenantBookings = this.state.bookings.filter((b) => {
      const bTime = new Date(b.start_time).getTime();
      return b.tenant_id === tenantId && bTime >= start && bTime < end;
    });

    const totalBookings = tenantBookings.length;
    const arrivalsCount = tenantBookings.filter((b) =>
      b.status === 'checked_in' || b.status === 'completed'
    ).length;
    const completedCount = tenantBookings.filter((b) => b.status === 'completed').length;
    const cancelledCount = tenantBookings.filter((b) => b.status === 'cancelled').length;

    const tenantPayments = this.state.payments.filter((p) => {
      const pTime = new Date(p.recorded_at).getTime();
      return p.tenant_id === tenantId && p.status === 'paid' && pTime >= start && pTime < end;
    });

    const actualRevenue = tenantPayments.reduce((acc, p) => acc + p.amount, 0);
    const activeResources = this.state.resources.filter(
      (r) => r.tenant_id === tenantId && r.is_active
    ).length;

    return {
      total_bookings: totalBookings,
      arrivals_count: arrivalsCount,
      completed_count: completedCount,
      cancelled_count: cancelledCount,
      actual_revenue: actualRevenue,
      active_resources: activeResources,
      period_start: startDateIso,
      period_end: endDateIso,
    };
  }

  /**
   * Outbox worker lease claiming matching claim_notification_jobs SQL
   */
  public claimNotificationJobs(workerId: string, limit: number = 10, leaseSeconds: number = 60) {
    const now = new Date();
    const claimed: DbNotificationJob[] = [];

    for (const job of this.state.notification_jobs) {
      if (claimed.length >= limit) break;

      const isPending = job.status === 'pending' && new Date(job.scheduled_for) <= now;
      const isExpiredLock =
        job.status === 'processing' &&
        job.locked_until &&
        new Date(job.locked_until) < now;

      if (isPending || isExpiredLock) {
        job.status = 'processing';
        job.locked_until = new Date(now.getTime() + leaseSeconds * 1000).toISOString();
        job.worker_id = workerId;
        claimed.push(job);
      }
    }

    this.saveToStorage();
    return claimed;
  }
}

export const mockDb = new MockDatabase();
