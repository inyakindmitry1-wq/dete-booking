import { describe, it, expect, beforeEach } from 'vitest';
import { mockDb } from '../../src/lib/db-mock';

describe('SQL Financial & Operational Statistics', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it('accurately distinguishes between arrivals, completed orders and collected revenue', () => {
    const tenantId = 'tenant-graphite';
    const srv = mockDb.getTenantServices(tenantId)[0];

    // Create 3 bookings
    const b1 = mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: srv.id,
      start_time: '2026-10-15T10:00:00.000Z',
      customer_name: 'Иван Иванов',
      customer_phone: '+79990000001',
    });

    const b2 = mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: srv.id,
      start_time: '2026-10-15T12:30:00.000Z',
      customer_name: 'Петр Петров',
      customer_phone: '+79990000002',
    });

    const b3 = mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: srv.id,
      start_time: '2026-10-15T15:00:00.000Z',
      customer_name: 'Сергей Сергеев',
      customer_phone: '+79990000003',
    });

    // 1. b1 is checked in, not yet paid
    mockDb.updateBookingStatus(b1.booking_id, 'checked_in');

    // 2. b2 is completed, and client paid 4500 cash
    mockDb.updateBookingStatus(b2.booking_id, 'completed');
    mockDb.recordPayment({
      tenant_id: tenantId,
      booking_id: b2.booking_id,
      amount: 4500,
      payment_method: 'cash',
      recorded_at: '2026-10-15T14:00:00.000Z',
    });

    // 3. b3 is confirmed in the future, price is 4500 (NOT REVENUE!)
    // b3 status is 'confirmed'

    const stats = mockDb.getOwnerStats(
      tenantId,
      '2026-10-15T00:00:00.000Z',
      '2026-10-15T23:59:59.000Z'
    );

    expect(stats.total_bookings).toBe(3);
    expect(stats.arrivals_count).toBe(2); // b1 (checked_in) + b2 (completed)
    expect(stats.completed_count).toBe(1); // only b2
    // INVARIANT 8: Future booking b3 is NOT counted as revenue!
    expect(stats.actual_revenue).toBe(4500); // only recorded payment from b2
  });
});
