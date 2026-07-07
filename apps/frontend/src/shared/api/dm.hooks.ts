import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dmApi, type DmMessage } from './dm.api';

export function useDmChats() {
  return useQuery({
    queryKey: ['dm', 'chats'],
    queryFn: () => dmApi.list(),
    refetchInterval: 15000,
  });
}

export function useDmGetOrCreate(username: string) {
  return useQuery({
    queryKey: ['dm', 'with', username],
    queryFn: () => dmApi.getOrCreate(username),
    enabled: !!username && username.length >= 2,
    retry: false,
  });
}

export function useDmMessages(chatId: string) {
  return useQuery({
    queryKey: ['dm', 'messages', chatId],
    queryFn: () => dmApi.messages(chatId),
    enabled: !!chatId,
    refetchInterval: 5000,
  });
}

export function useDeleteDmChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => dmApi.deleteChat(chatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dm', 'chats'] });
    },
  });
}

export function useSendDm(chatId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, replyToId }: { content: string; replyToId?: string }) =>
      dmApi.send(chatId, content, replyToId),
    onSuccess: (msg) => {
      qc.setQueryData<DmMessage[]>(['dm', 'messages', chatId], (prev) =>
        prev ? [...prev, msg] : [msg],
      );
      qc.invalidateQueries({ queryKey: ['dm', 'chats'] });
    },
  });
}
