import { DbWorkingHours, DbScheduleException, DbResourceOccupancy, TimeSlot } from '@/types/database';

export interface CalculateSlotsParams {
  date: string; // 'YYYY-MM-DD'
  serviceDurationMinutes: number;
  serviceBufferMinutes: number;
  eligibleResourceIds: string[];
  workingHours: DbWorkingHours[];
  exceptions?: DbScheduleException[];
  existingOccupancies: DbResourceOccupancy[];
  slotIntervalMinutes?: number; // default 30 or 60 min
}

/**
 * Calculates intake start slots for a given date, checking working hours, exceptions,
 * and continuous resource occupancies across bays/lifts.
 */
export function calculateAvailableSlots(params: CalculateSlotsParams): TimeSlot[] {
  const {
    date,
    serviceDurationMinutes,
    serviceBufferMinutes,
    eligibleResourceIds,
    workingHours,
    exceptions = [],
    existingOccupancies,
    slotIntervalMinutes = 30,
  } = params;

  if (eligibleResourceIds.length === 0) {
    return [];
  }

  const targetDate = new Date(`${date}T00:00:00.000Z`);
  const dayOfWeek = targetDate.getUTCDay(); // 0 (Sun) to 6 (Sat)

  // 1. Check for specific date exceptions
  const exception = exceptions.find((e) => e.date === date);
  if (exception && exception.is_closed) {
    return [];
  }

  // 2. Determine operating hours for this date
  let openTimeStr = '09:00';
  let closeTimeStr = '20:00';
  let isClosed = false;

  if (exception) {
    openTimeStr = exception.open_time || '09:00';
    closeTimeStr = exception.close_time || '20:00';
  } else {
    const dayConfig = workingHours.find((w) => w.day_of_week === dayOfWeek);
    if (!dayConfig || dayConfig.is_closed) {
      isClosed = true;
    } else {
      openTimeStr = dayConfig.open_time.slice(0, 5);
      closeTimeStr = dayConfig.close_time.slice(0, 5);
    }
  }

  if (isClosed) {
    return [];
  }

  const [openH, openM] = openTimeStr.split(':').map(Number);
  const [closeH, closeM] = closeTimeStr.split(':').map(Number);

  const dayStartMin = openH * 60 + openM;
  const dayEndMin = closeH * 60 + closeM;

  const totalServiceDuration = serviceDurationMinutes + serviceBufferMinutes;
  const slots: TimeSlot[] = [];

  // Intake moments can start from dayStartMin up to dayEndMin
  // Note: for multi-day services, client drops car off during work hours; work continues through subsequent days.
  for (let currentMin = dayStartMin; currentMin < dayEndMin; currentMin += slotIntervalMinutes) {
    const h = Math.floor(currentMin / 60).toString().padStart(2, '0');
    const m = (currentMin % 60).toString().padStart(2, '0');
    const displayTime = `${h}:${m}`;

    const slotStart = new Date(`${date}T${displayTime}:00.000Z`);
    const slotEnd = new Date(slotStart.getTime() + totalServiceDuration * 60 * 1000);

    const slotStartIso = slotStart.toISOString();
    const slotEndIso = slotEnd.toISOString();

    // Check if at least one eligible resource is completely free for [slotStart, slotEnd)
    let assignedResourceId = '';
    let isSlotAvailable = false;

    for (const resId of eligibleResourceIds) {
      const hasConflict = existingOccupancies.some((occ) => {
        if (occ.resource_id !== resId) return false;

        const occStart = new Date(occ.start_time).getTime();
        const occEnd = new Date(occ.end_time).getTime();
        const currentSlotStart = slotStart.getTime();
        const currentSlotEnd = slotEnd.getTime();

        // Intervals overlap if currentSlotStart < occEnd && occStart < currentSlotEnd
        return currentSlotStart < occEnd && occStart < currentSlotEnd;
      });

      if (!hasConflict) {
        assignedResourceId = resId;
        isSlotAvailable = true;
        break; // Found an available bay/lift
      }
    }

    slots.push({
      time: slotStartIso,
      display_time: displayTime,
      available_resource_id: assignedResourceId,
      is_available: isSlotAvailable,
    });
  }

  return slots;
}
