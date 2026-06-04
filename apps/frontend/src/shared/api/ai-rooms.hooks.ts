import { useMutation } from '@tanstack/react-query';
import { aiRoomsApi } from './ai-rooms.api';

export function useAiRoomDraft() {
  return useMutation({ mutationFn: (prompt: string) => aiRoomsApi.draft(prompt) });
}

import { useQueryClient } from '@tanstack/react-query';
import type { RoomDraft } from './ai-rooms.api';
import { api } from './client';

export function useAiRoomCommit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: RoomDraft) => api.post('/rooms/ai-commit', {
      name: draft.room.name,
      description: draft.room.description,
      eventDate: draft.room.eventDate,
      polls: draft.polls.map((p) => ({
        kind: p.kind,
        question: p.question,
        options: p.options,
        resolvedPlaces: p.resolvedPlaces,
      })),
    }).then((r) => r.data as { id: string }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });
}
