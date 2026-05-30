import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { blocksApi } from './blocks.api';

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['blocks'],
    queryFn: () => blocksApi.list(),
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      blocksApi.block(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocks'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => blocksApi.unblock(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocks'] });
    },
  });
}
