import { describe, it, expect, beforeEach } from 'vitest';
import { mockDb } from '../../src/lib/db-mock';

describe('Atomic Booking & Concurrency Invariants', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it('prevents double booking on the same bay via EXCLUDE constraint logic', () => {
    const tenantId = 'tenant-graphite';
    const srv = mockDb.getTenantServices(tenantId).find((s) => s.category === 'Мойка и уход')!;

    // 1st booking: occupies Wash Bay from 10:00 to 12:15
    const b1 = mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: srv.id,
      start_time: '2026-10-15T10:00:00.000Z',
      customer_name: 'Клиент 1',
      customer_phone: '+79991111111',
    });
    expect(b1.booking_id).toBeDefined();

    // 2nd booking attempt: overlapping time [10:30, 12:45) on the only wash bay
    expect(() => {
      mockDb.createBookingAtomic({
        tenant_slug: 'graphite',
        service_id: srv.id,
        start_time: '2026-10-15T10:30:00.000Z',
        customer_name: 'Клиент 2',
        customer_phone: '+79992222222',
      });
    }).toThrow('NO_AVAILABLE_RESOURCE_SLOT');
  });

  it('enforces idempotency: repeated request returns existing booking without creating duplicates', () => {
    const tenantId = 'tenant-graphite';
    const srv = mockDb.getTenantServices(tenantId)[0];
    const idempotencyKey = 'req-unique-uuid-999';

    const b1 = mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: srv.id,
      start_time: '2026-10-15T14:00:00.000Z',
      customer_name: 'Клиент Повтор',
      customer_phone: '+79993333333',
      idempotency_key: idempotencyKey,
    });
    expect(b1.is_duplicate).toBe(false);

    // Repeated call with same idempotency key
    const b2 = mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: srv.id,
      start_time: '2026-10-15T14:00:00.000Z',
      customer_name: 'Клиент Повтор',
      customer_phone: '+79993333333',
      idempotency_key: idempotencyKey,
    });

    expect(b2.is_duplicate).toBe(true);
    expect(b2.booking_id).toBe(b1.booking_id);

    // Ensure total bookings count is 1, not 2
    const allBookings = mockDb.getState().bookings.filter((b) => b.idempotency_key === idempotencyKey);
    expect(allBookings.length).toBe(1);
  });

  it('handles multi-day continuous occupancy (e.g. 24h Ceramic or PPF wrap)', () => {
    const tenantId = 'tenant-graphite';
    // PPF wrap takes 1440 min (24 hours) + 120 min buffer
    const ppfService = mockDb.getTenantServices(tenantId).find((s) => s.duration_minutes >= 1440)!;
    expect(ppfService).toBeDefined();

    const booking = mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: ppfService.id,
      start_time: '2026-10-15T10:00:00.000Z',
      customer_name: 'Владелец Porsche',
      customer_phone: '+79995555555',
    });

    // Check that end time is > 24 hours later
    const startTime = new Date(booking.start_time).getTime();
    const endTime = new Date(booking.end_time).getTime();
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
    expect(durationHours).toBe(26); // 24h + 2h buffer

    // Attempting another booking in that bay during the next day morning must fail
    expect(() => {
      mockDb.createBookingAtomic({
        tenant_slug: 'graphite',
        service_id: ppfService.id,
        start_time: '2026-10-16T09:00:00.000Z',
        customer_name: 'Второй клиент',
        customer_phone: '+79996666666',
      });
    }).toThrow('NO_AVAILABLE_RESOURCE_SLOT');
  });

  it('prevents booking when a bay is locked with a manual block (maintenance)', () => {
    const tenantId = 'tenant-graphite';
    const washBay = mockDb.getTenantResources(tenantId).find((r) => r.type === 'wash_bay')!;
    const washService = mockDb.getTenantServices(tenantId).find((s) => s.category === 'Мойка и уход')!;

    // Owner creates manual block for pressure washer maintenance
    mockDb.createManualBlock({
      tenant_id: tenantId,
      resource_id: washBay.id,
      start_time: '2026-10-15T10:00:00.000Z',
      end_time: '2026-10-15T14:00:00.000Z',
      note: 'Ремонт АВД',
    });

    // Booking attempt on that bay must fail
    expect(() => {
      mockDb.createBookingAtomic({
        tenant_slug: 'graphite',
        service_id: washService.id,
        start_time: '2026-10-15T11:00:00.000Z',
        customer_name: 'Клиент',
        customer_phone: '+79997777777',
      });
    }).toThrow('NO_AVAILABLE_RESOURCE_SLOT');
  });

  it('invariant 4: failed reschedule does NOT forfeit original booking', () => {
    const tenantId = 'tenant-graphite';
    const srv = mockDb.getTenantServices(tenantId).find((s) => s.category === 'Мойка и уход')!;

    const b1 = mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: srv.id,
      start_time: '2026-10-15T10:00:00.000Z',
      customer_name: 'Клиент А',
      customer_phone: '+79998888881',
      access_token_hash: 'hash-a',
    });

    const b2 = mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: srv.id,
      start_time: '2026-10-15T14:00:00.000Z',
      customer_name: 'Клиент Б',
      customer_phone: '+79998888882',
      access_token_hash: 'hash-b',
    });

    // Client B tries to reschedule to 10:30 (conflicts with Client A)
    expect(() => {
      mockDb.rescheduleBookingAtomic(b2.booking_id, 'hash-b', '2026-10-15T10:30:00.000Z');
    }).toThrow('NEW_SLOT_UNAVAILABLE');

    // Verify b2 still retains original start time 14:00
    const originalB2 = mockDb.getState().bookings.find((b) => b.id === b2.booking_id)!;
    expect(originalB2.start_time).toBe('2026-10-15T14:00:00.000Z');
    expect(originalB2.status).toBe('confirmed');
  });

  it('preserves historical price snapshot even if service price changes in config', () => {
    const tenantId = 'tenant-graphite';
    const srv = mockDb.getTenantServices(tenantId)[0];
    const originalPrice = srv.price;

    const booking = mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: srv.id,
      start_time: '2026-10-15T10:00:00.000Z',
      customer_name: 'Клиент',
      customer_phone: '+79999999999',
    });

    // Simulate price increase by owner
    srv.price = 99999;

    const savedBooking = mockDb.getState().bookings.find((b) => b.id === booking.booking_id)!;
    expect(savedBooking.price_snapshot).toBe(originalPrice);
    expect(savedBooking.price_snapshot).not.toBe(99999);
  });
});
