import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invitesApi } from './invites.api';

export function useIncomingInvites() {
  return useQuery({
    queryKey: ['invites', 'incoming'],
    queryFn: () => invitesApi.myIncoming(),
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invitesApi.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeclineInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invitesApi.decline(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeferInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invitesApi.defer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites'] });
    },
  });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      username,
      message,
    }: {
      roomId: string;
      username: string;
      message?: string;
    }) => invitesApi.create(roomId, username, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites'] });
    },
  });
}
