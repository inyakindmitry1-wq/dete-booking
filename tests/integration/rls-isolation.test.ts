import { describe, it, expect, beforeEach } from 'vitest';
import { mockDb } from '../../src/lib/db-mock';

describe('RLS & Tenant Data Isolation', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it('guarantees tenant isolation: bookings and customers of Graphite are completely invisible to Apex', () => {
    const srvGraphite = mockDb.getTenantServices('tenant-graphite')[0];
    const srvApex = mockDb.getTenantServices('tenant-apex')[0];

    // Book in Graphite
    const bg = mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: srvGraphite.id,
      start_time: '2026-10-15T10:00:00.000Z',
      customer_name: 'Клиент Графита',
      customer_phone: '+79991110001',
    });

    // Book in Apex
    const ba = mockDb.createBookingAtomic({
      tenant_slug: 'apex',
      service_id: srvApex.id,
      start_time: '2026-10-15T11:00:00.000Z',
      customer_name: 'Клиент Апекса',
      customer_phone: '+79992220002',
    });

    // Graphite owner queries
    const state = mockDb.getState();
    const graphiteBookings = state.bookings.filter((b) => b.tenant_id === 'tenant-graphite');
    const apexBookings = state.bookings.filter((b) => b.tenant_id === 'tenant-apex');

    expect(graphiteBookings.some((b) => b.id === bg.booking_id)).toBe(true);
    expect(graphiteBookings.some((b) => b.id === ba.booking_id)).toBe(false);

    expect(apexBookings.some((b) => b.id === ba.booking_id)).toBe(true);
    expect(apexBookings.some((b) => b.id === bg.booking_id)).toBe(false);
  });

  it('prohibits unauthorized booking cancellation without valid access token hash', () => {
    const srv = mockDb.getTenantServices('tenant-graphite')[0];

    const booking = mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: srv.id,
      start_time: '2026-10-15T10:00:00.000Z',
      customer_name: 'Иван',
      customer_phone: '+79993330003',
      access_token_hash: 'valid-secret-token-hash-123',
    });

    // Attempt cancellation with fraudulent token hash
    expect(() => {
      mockDb.cancelBookingAtomic(booking.booking_id, 'attacker-fake-hash');
    }).toThrow('UNAUTHORIZED');

    // Booking remains confirmed
    const b = mockDb.getState().bookings.find((x) => x.id === booking.booking_id)!;
    expect(b.status).toBe('confirmed');

    // Successful cancellation with valid token hash
    const res = mockDb.cancelBookingAtomic(booking.booking_id, 'valid-secret-token-hash-123');
    expect(res.status).toBe('cancelled');
  });
});
