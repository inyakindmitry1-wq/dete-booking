import { describe, it, expect } from 'vitest';
import { calculateAvailableSlots } from '../../src/lib/slots';
import { DbWorkingHours, DbResourceOccupancy } from '../../src/types/database';

describe('Slots Calculation Engine', () => {
  const mockWorkingHours: DbWorkingHours[] = [
    { id: '1', tenant_id: 't1', day_of_week: 1, open_time: '10:00:00', close_time: '14:00:00', is_closed: false },
  ];

  it('generates slots within business operating hours', () => {
    // 2026-10-12 is a Monday (day_of_week: 1)
    const slots = calculateAvailableSlots({
      date: '2026-10-12',
      serviceDurationMinutes: 60,
      serviceBufferMinutes: 15,
      eligibleResourceIds: ['res-1'],
      workingHours: mockWorkingHours,
      existingOccupancies: [],
      slotIntervalMinutes: 60,
    });

    expect(slots.length).toBe(4); // 10:00, 11:00, 12:00, 13:00
    expect(slots[0].display_time).toBe('10:00');
    expect(slots[0].is_available).toBe(true);
    expect(slots[3].display_time).toBe('13:00');
  });

  it('detects continuous occupancy conflict and marks slot unavailable', () => {
    const existingOccupancy: DbResourceOccupancy = {
      id: 'occ-1',
      tenant_id: 't1',
      resource_id: 'res-1',
      occupancy_type: 'booking',
      start_time: '2026-10-12T11:00:00.000Z',
      end_time: '2026-10-12T12:15:00.000Z', // 75 min (60 duration + 15 buffer)
      created_at: new Date().toISOString(),
    };

    const slots = calculateAvailableSlots({
      date: '2026-10-12',
      serviceDurationMinutes: 60,
      serviceBufferMinutes: 15,
      eligibleResourceIds: ['res-1'],
      workingHours: mockWorkingHours,
      existingOccupancies: [existingOccupancy],
      slotIntervalMinutes: 60,
    });

    const slot10 = slots.find((s) => s.display_time === '10:00');
    const slot11 = slots.find((s) => s.display_time === '11:00');

    // Slot at 11:00 conflicts with [11:00, 12:15)
    expect(slot11?.is_available).toBe(false);
  });

  it('allocates to second resource when first resource is occupied', () => {
    const existingOccupancy: DbResourceOccupancy = {
      id: 'occ-1',
      tenant_id: 't1',
      resource_id: 'res-1',
      occupancy_type: 'booking',
      start_time: '2026-10-12T11:00:00.000Z',
      end_time: '2026-10-12T12:15:00.000Z',
      created_at: new Date().toISOString(),
    };

    const slots = calculateAvailableSlots({
      date: '2026-10-12',
      serviceDurationMinutes: 60,
      serviceBufferMinutes: 15,
      eligibleResourceIds: ['res-1', 'res-2'], // Two bays available
      workingHours: mockWorkingHours,
      existingOccupancies: [existingOccupancy],
      slotIntervalMinutes: 60,
    });

    const slot11 = slots.find((s) => s.display_time === '11:00');
    expect(slot11?.is_available).toBe(true);
    expect(slot11?.available_resource_id).toBe('res-2');
  });

  it('respects day off / closed exceptions', () => {
    const slots = calculateAvailableSlots({
      date: '2026-10-12',
      serviceDurationMinutes: 60,
      serviceBufferMinutes: 15,
      eligibleResourceIds: ['res-1'],
      workingHours: mockWorkingHours,
      exceptions: [{ id: 'ex-1', tenant_id: 't1', date: '2026-10-12', is_closed: true }],
      existingOccupancies: [],
    });

    expect(slots.length).toBe(0);
  });
});
