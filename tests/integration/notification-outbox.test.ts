import { describe, it, expect, beforeEach } from 'vitest';
import { mockDb } from '../../src/lib/db-mock';

describe('Notification Outbox & Worker Leases', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it('claims pending notification jobs with distributed lease and worker ID', () => {
    const srv = mockDb.getTenantServices('tenant-graphite')[0];

    // Create a booking which schedules a notification job
    mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: srv.id,
      start_time: '2026-10-15T10:00:00.000Z',
      customer_name: 'Ольга',
      customer_phone: '+79994440004',
    });

    // Worker 1 claims pending job with 60 second lease
    const claimedByWorker1 = mockDb.claimNotificationJobs('worker-instance-alpha', 10, 60);
    expect(claimedByWorker1.length).toBeGreaterThan(0);
    expect(claimedByWorker1[0].status).toBe('processing');
    expect(claimedByWorker1[0].worker_id).toBe('worker-instance-alpha');
    expect(claimedByWorker1[0].locked_until).toBeDefined();

    // Worker 2 attempts to claim at the same moment -> must get 0 jobs (locked!)
    const claimedByWorker2 = mockDb.claimNotificationJobs('worker-instance-beta', 10, 60);
    expect(claimedByWorker2.length).toBe(0);
  });

  it('cancels pending notification jobs when booking is cancelled', () => {
    const srv = mockDb.getTenantServices('tenant-graphite')[0];

    const booking = mockDb.createBookingAtomic({
      tenant_slug: 'graphite',
      service_id: srv.id,
      start_time: '2026-10-15T10:00:00.000Z',
      customer_name: 'Дмитрий',
      customer_phone: '+79995550005',
    });

    const pendingJobsBefore = mockDb
      .getState()
      .notification_jobs.filter((j) => j.booking_id === booking.booking_id);
    expect(pendingJobsBefore.some((j) => j.status === 'pending')).toBe(true);

    // Cancel booking
    mockDb.cancelBookingAtomic(booking.booking_id);

    const pendingJobsAfter = mockDb
      .getState()
      .notification_jobs.filter((j) => j.booking_id === booking.booking_id);
    expect(pendingJobsAfter.every((j) => j.status === 'cancelled')).toBe(true);
  });
});
