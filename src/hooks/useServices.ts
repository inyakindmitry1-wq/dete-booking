import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DbService } from '@/types/database';

export function useServices(tenantId: string | undefined) {
  return useQuery<DbService[]>({
    queryKey: ['services', tenantId],
    queryFn: () => (tenantId ? api.getServices(tenantId) : Promise.resolve([])),
    enabled: Boolean(tenantId),
    staleTime: 1000 * 60 * 5,
  });
}
