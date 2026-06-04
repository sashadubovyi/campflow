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

export function useRoom(id: string) {
  return useQuery({
    queryKey: ['room', id],
    queryFn: () => roomsApi.get(id),
    enabled: !!id,
  });
}

export function useCloseRoom(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => roomsApi.close(roomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['room', roomId] });
      qc.invalidateQueries({ queryKey: ['polls', roomId] });
      qc.invalidateQueries({ queryKey: ['final-plan', roomId] });
      qc.invalidateQueries({ queryKey: ['messages', roomId] });
    },
  });
}

export function useArchiveRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => roomsApi.archive(roomId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });
}
