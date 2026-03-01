import { useQuery } from '@tanstack/react-query';
import { fetchPercentages } from '../lib/api';

export function usePercentages() {
  return useQuery({
    queryKey: ['percentages'],
    queryFn: fetchPercentages,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
