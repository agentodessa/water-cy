import { useQuery } from '@tanstack/react-query';
import { fetchMonthlyInflows } from '../lib/api';

export function useMonthlyInflows() {
  return useQuery({
    queryKey: ['monthly-inflows'],
    queryFn: fetchMonthlyInflows,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
