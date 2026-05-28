import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roomsApi, type CreateRoomPayload } from './rooms.api';

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.list,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoomPayload) => roomsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useJoinRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => roomsApi.join(inviteCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
