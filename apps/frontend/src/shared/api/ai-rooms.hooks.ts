import { useMutation } from '@tanstack/react-query';
import { aiRoomsApi } from './ai-rooms.api';

export function useAiRoomDraft() {
  return useMutation({ mutationFn: (prompt: string) => aiRoomsApi.draft(prompt) });
}
