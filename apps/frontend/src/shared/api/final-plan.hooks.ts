import { useQuery } from '@tanstack/react-query';
import { finalPlanApi } from './final-plan.api';

export function useFinalPlan(roomId: string) {
  return useQuery({
    queryKey: ['final-plan', roomId],
    queryFn: () => finalPlanApi.get(roomId),
    enabled: !!roomId,
  });
}
