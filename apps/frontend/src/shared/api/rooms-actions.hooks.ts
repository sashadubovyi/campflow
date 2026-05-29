import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, memberId }: { roomId: string; memberId: string }) => {
      const { data } = await api.delete(`/rooms/${roomId}/members/${memberId}`);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['room', vars.roomId] });
    },
  });
}

export function useLeaveRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => {
      const { data } = await api.delete<{ ok: boolean; deleted: boolean }>(
        `/rooms/${roomId}/members/me`,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useTransferAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, memberId }: { roomId: string; memberId: string }) => {
      const { data } = await api.patch(`/rooms/${roomId}/members/${memberId}/role`);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['room', vars.roomId] });
    },
  });
}
