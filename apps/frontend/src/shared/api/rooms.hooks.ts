import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roomsApi, type CreateRoomPayload, type UpdateRoomPayload } from './rooms.api';

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.list,
  });
}

export function usePublicRooms() {
  return useQuery({
    queryKey: ['rooms', 'public'],
    queryFn: roomsApi.listPublic,
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

export function useJoinPublicRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => roomsApi.joinPublic(roomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useRequestJoin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => roomsApi.requestJoin(roomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', 'public'] });
    },
  });
}

export function useAcceptJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => roomsApi.acceptJoinRequest(notificationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useRejectJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => roomsApi.rejectJoinRequest(notificationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
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

export function useUpdateRoom(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRoomPayload) => roomsApi.update(roomId, payload),
    onSuccess: (updated) => {
      qc.setQueryData(['room', roomId], updated);
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useUploadRoomCover(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => roomsApi.uploadCover(roomId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['room', roomId] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
