import { useQuery } from '@tanstack/react-query';
import { mapApi } from './map.api';

export function useMapPoints() {
  return useQuery({
    queryKey: ['map-points'],
    queryFn: () => mapApi.getPoints(),
  });
}
