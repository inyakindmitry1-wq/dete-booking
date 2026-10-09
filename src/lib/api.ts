import { supabase, isLiveSupabaseConfigured } from './supabase';
import { mockDb } from './db-mock';
import { DbTenant, DbService, DbResource, DbBooking, CreateBookingRequest, CreateBookingResponse, TimeSlot } from '@/types/database';
import { calculateAvailableSlots } from './slots';
import { hashToken } from './crypto';

export const api = {
  // Fetch tenant profile by slug
  async getTenant(slug: string): Promise<DbTenant | null> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) {
        console.error('Supabase getTenant error:', error);
      }
      if (data) return data;
    }
    return mockDb.getTenantBySlug(slug) || null;
  },

  // Fetch active services for tenant
  async getServices(tenantId: string): Promise<DbService[]> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) console.error('Supabase getServices error:', error);
      if (data && data.length > 0) return data;
    }
    return mockDb.getTenantServices(tenantId);
  },

  // Fetch active resources for tenant
  async getResources(tenantId: string): Promise<DbResource[]> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) console.error('Supabase getResources error:', error);
      if (data && data.length > 0) return data;
    }
    return mockDb.getTenantResources(tenantId);
  },

  // Compute available slots for a given date
  async getAvailableSlots(params: {
    tenant: DbTenant;
    serviceId: string;
    date: string; // YYYY-MM-DD
  }): Promise<TimeSlot[]> {
    const { tenant, serviceId, date } = params;

    let service: DbService | undefined;
    let eligibleResourceIds: string[] = [];
    let workingHours = [];
    let exceptions = [];
    let occupancies = [];

    if (isLiveSupabaseConfigured) {
      // Fetch service info
      const { data: sData } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('id', serviceId)
        .single();
      service = sData;

      // Fetch eligible resources
      const { data: srData } = await supabase
        .from('service_resources')
        .select('resource_id')
        .eq('tenant_id', tenant.id)
        .eq('service_id', serviceId);
      eligibleResourceIds = (srData || []).map((x) => x.resource_id);

      // Fetch working hours
      const { data: whData } = await supabase
        .from('working_hours')
        .select('*')
        .eq('tenant_id', tenant.id);
      workingHours = whData || [];

      // Fetch exceptions
      const { data: seData } = await supabase
        .from('schedule_exceptions')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('date', date);
      exceptions = seData || [];

      // Fetch occupancies around target date (+3 days for multi-day services)
      const startDate = `${date}T00:00:00Z`;
      const endDate = new Date(new Date(date).getTime() + 4 * 86400000).toISOString();
      const { data: roData } = await supabase
        .from('resource_occupancies')
        .select('*')
        .eq('tenant_id', tenant.id);
      occupancies = roData || [];
    } else {
      service = mockDb.getTenantServices(tenant.id).find((s) => s.id === serviceId);
      eligibleResourceIds = mockDb.getServiceResources(tenant.id, serviceId);
      workingHours = mockDb.getWorkingHours(tenant.id);
      exceptions = mockDb.getScheduleExceptions(tenant.id);
      occupancies = mockDb.getResourceOccupancies(tenant.id);
    }

    if (!service) return [];

    return calculateAvailableSlots({
      date,
      serviceDurationMinutes: service.duration_minutes,
      serviceBufferMinutes: service.buffer_minutes,
      eligibleResourceIds,
      workingHours,
      exceptions,
      existingOccupancies: occupancies,
    });
  },

  // Create booking atomically (with client access token)
  async createBooking(
    payload: CreateBookingRequest,
    rawAccessToken: string
  ): Promise<CreateBookingResponse> {
    const tokenHash = await hashToken(rawAccessToken);

    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase.rpc('create_booking_atomic', {
        p_tenant_slug: payload.tenant_slug,
        p_service_id: payload.service_id,
        p_start_time: payload.start_time,
        p_customer_name: payload.customer_name,
        p_customer_phone: payload.customer_phone,
        p_car_model: payload.car_model || null,
        p_car_plate: payload.car_plate || null,
        p_customer_notes: payload.customer_notes || null,
        p_idempotency_key: payload.idempotency_key,
        p_access_token_hash: tokenHash,
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        booking_id: data.booking_id,
        access_token: rawAccessToken,
        start_time: data.start_time,
        end_time: data.end_time,
        service_name: data.service_name,
        price: data.price,
        resource_name: data.resource_name,
        status: data.status,
      };
    }

    const res = mockDb.createBookingAtomic({
      tenant_slug: payload.tenant_slug,
      service_id: payload.service_id,
      start_time: payload.start_time,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      car_model: payload.car_model,
      car_plate: payload.car_plate,
      customer_notes: payload.customer_notes,
      idempotency_key: payload.idempotency_key,
      access_token_hash: tokenHash,
    });

    return {
      booking_id: res.booking_id,
      access_token: rawAccessToken,
      start_time: res.start_time,
      end_time: res.end_time,
      service_name: res.service_name,
      price: res.price,
      resource_name: res.resource_name,
      status: res.status,
    };
  },

  // Lookup booking details by access token hash
  async lookupBooking(bookingId: string, rawAccessToken: string): Promise<DbBooking | null> {
    const tokenHash = await hashToken(rawAccessToken);

    if (isLiveSupabaseConfigured) {
      // In live mode, bookings are protected by RLS; an edge function or secure view handles lookup
      const { data, error } = await supabase
        .from('bookings')
        .select('*, customer:customers(*), service:services(*), resource:resources(*)')
        .eq('id', bookingId)
        .eq('access_token_hash', tokenHash)
        .maybeSingle();

      if (error) console.error('Lookup booking error:', error);
      if (data) return data;
    }

    const state = mockDb.getState();
    const b = state.bookings.find((x) => x.id === bookingId && x.access_token_hash === tokenHash);
    if (!b) return null;

    const customer = state.customers.find((c) => c.id === b.customer_id);
    const service = state.services.find((s) => s.id === b.service_id);
    const resource = state.resources.find((r) => r.id === b.resource_id);

    return {
      ...b,
      customer,
      service,
      resource,
    };
  },

  // Reschedule booking
  async rescheduleBooking(
    bookingId: string,
    rawAccessToken: string,
    newStartTime: string
  ) {
    const tokenHash = await hashToken(rawAccessToken);

    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase.rpc('reschedule_booking_atomic', {
        p_booking_id: bookingId,
        p_access_token_hash: tokenHash,
        p_new_start_time: newStartTime,
      });
      if (error) throw new Error(error.message);
      return data;
    }

    return mockDb.rescheduleBookingAtomic(bookingId, tokenHash, newStartTime);
  },

  // Cancel booking
  async cancelBooking(bookingId: string, rawAccessToken?: string, reason?: string) {
    const tokenHash = rawAccessToken ? await hashToken(rawAccessToken) : undefined;

    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase.rpc('cancel_booking_atomic', {
        p_booking_id: bookingId,
        p_access_token_hash: tokenHash || null,
        p_reason: reason || null,
      });
      if (error) throw new Error(error.message);
      return data;
    }

    return mockDb.cancelBookingAtomic(bookingId, tokenHash);
  },

  // Owner schedule data
  async getOwnerSchedule(tenantId: string, date: string) {
    const state = mockDb.getState();
    const resources = state.resources.filter((r) => r.tenant_id === tenantId && r.is_active);

    const startOfDay = new Date(`${date}T00:00:00Z`).getTime();
    const endOfDay = new Date(`${date}T23:59:59Z`).getTime();

    const bookings = state.bookings
      .filter((b) => {
        const bStart = new Date(b.start_time).getTime();
        return b.tenant_id === tenantId && bStart >= startOfDay && bStart <= endOfDay;
      })
      .map((b) => ({
        ...b,
        customer: state.customers.find((c) => c.id === b.customer_id),
        service: state.services.find((s) => s.id === b.service_id),
        resource: state.resources.find((r) => r.id === b.resource_id),
      }));

    const occupancies = state.resource_occupancies.filter((ro) => ro.tenant_id === tenantId);

    return {
      resources,
      bookings,
      occupancies,
    };
  },

  // Owner analytics
  async getOwnerAnalytics(tenantId: string, startDate: string, endDate: string) {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase.rpc('get_owner_stats', {
        p_tenant_id: tenantId,
        p_start_date: startDate,
        p_end_date: endDate,
      });
      if (error) console.error('get_owner_stats error:', error);
      if (data) return data;
    }

    return mockDb.getOwnerStats(tenantId, startDate, endDate);
  },

  // Manual block
  async createManualBlock(params: {
    tenant_id: string;
    resource_id: string;
    start_time: string;
    end_time: string;
    note: string;
  }) {
    return mockDb.createManualBlock(params);
  },

  // Record payment
  async recordPayment(params: {
    tenant_id: string;
    booking_id: string;
    amount: number;
    payment_method: 'cash' | 'card' | 'transfer';
    note?: string;
  }) {
    return mockDb.recordPayment(params);
  },

  // Update booking status
  async updateBookingStatus(bookingId: string, status: DbBooking['status']) {
    return mockDb.updateBookingStatus(bookingId, status);
  },
};
