import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DbTenant, TimeSlot } from '@/types/database';

export function useSlots(tenant: DbTenant | null | undefined, serviceId: string | null, date: string) {
  return useQuery<TimeSlot[]>({
    queryKey: ['slots', tenant?.id, serviceId, date],
    queryFn: () => {
      if (!tenant || !serviceId || !date) return Promise.resolve([]);
      return api.getAvailableSlots({ tenant, serviceId, date });
    },
    enabled: Boolean(tenant && serviceId && date),
    staleTime: 1000 * 30, // 30 seconds fresh
  });
}
