import { useQuery } from '@tanstack/react-query';
import { fetchDams } from '../lib/api';

export function useDams() {
  return useQuery({
    queryKey: ['dams'],
    queryFn: fetchDams,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
