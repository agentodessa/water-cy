import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '../lib/api';

export function useEvents(from?: string, to?: string) {
  return useQuery({
    queryKey: ['events', from, to],
    queryFn: () => fetchEvents(from, to),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
