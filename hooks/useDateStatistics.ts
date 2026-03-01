import { useQuery } from '@tanstack/react-query';
import { fetchDateStatistics } from '../lib/api';

export function useDateStatistics(date?: string) {
  return useQuery({
    queryKey: ['date-statistics', date],
    queryFn: () => fetchDateStatistics(date),
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
