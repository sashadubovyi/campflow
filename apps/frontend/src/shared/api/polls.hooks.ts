import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  pollsApi,
  type PollDetails,
  type CreateSinglePollPayload,
  type CreateMultiPollPayload,
  type CreateLocationPollPayload,
} from './polls.api';
import { getSocket } from '../socket/socket';

// === Список опитувань кімнати + підписка на WS-події ===

export function usePolls(roomId: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['polls', roomId],
    queryFn: () => pollsApi.listByRoom(roomId),
    enabled: !!roomId,
  });

  // Підписка на WS-події: poll:created, poll:update
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    function onPollCreated(poll: PollDetails) {
      if (poll.roomId !== roomId) return;
      qc.setQueryData<PollDetails[]>(['polls', roomId], (prev = []) => {
        // Не дублюємо, якщо вже додано (через оптимістичний UI)
        if (prev.some((p) => p.id === poll.id)) return prev;
        return [poll, ...prev];
      });
    }

    function onPollUpdate(poll: PollDetails) {
      if (poll.roomId !== roomId) return;
      qc.setQueryData<PollDetails[]>(['polls', roomId], (prev = []) =>
        prev.map((p) => (p.id === poll.id ? poll : p)),
      );
    }

    socket.on('poll:created', onPollCreated);
    socket.on('poll:update', onPollUpdate);

    return () => {
      socket.off('poll:created', onPollCreated);
      socket.off('poll:update', onPollUpdate);
    };
  }, [roomId, qc]);

  return query;
}

// === Мутації створення ===

export function useCreateSinglePoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSinglePollPayload) => pollsApi.createSingle(payload),
    onSuccess: (poll) => {
      qc.invalidateQueries({ queryKey: ['polls', poll.roomId] });
    },
  });
}

export function useCreateMultiPoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMultiPollPayload) => pollsApi.createMulti(payload),
    onSuccess: (poll) => {
      qc.invalidateQueries({ queryKey: ['polls', poll.roomId] });
    },
  });
}

export function useCreateLocationPoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLocationPollPayload) => pollsApi.createLocation(payload),
    onSuccess: (poll) => {
      qc.invalidateQueries({ queryKey: ['polls', poll.roomId] });
    },
  });
}

// === Голосування з оптимістичним UI ===

export function useVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      pollsApi.vote(pollId, optionId),
    onMutate: async ({ pollId, optionId }) => {
      // Скасовуємо in-flight refetch — інакше стара відповідь, що прилетить
      // після оптимістичного запису, відкотить голос до onSettled.
      await qc.cancelQueries({ queryKey: ['polls'] });
      // Знаходимо опитування в кеші й одразу оновлюємо UI
      const queries = qc.getQueriesData<PollDetails[]>({ queryKey: ['polls'] });
      const snapshots: [readonly unknown[], PollDetails[] | undefined][] = [];

      for (const [key, polls] of queries) {
        if (!polls) continue;
        const updated = polls.map((p) => {
          if (p.id !== pollId) return p;
          // Знімаємо попередній голос (single_choice — один голос)
          const prevVoted = p.myVotes;
          const optionsUpdated = p.options.map((o) => {
            let votes = o.votes;
            if (prevVoted.includes(o.id)) votes -= 1;
            if (o.id === optionId) votes += 1;
            return { ...o, votes };
          });
          // Прогрес: якщо я раніше не голосував — voted+1
          const wasVoting = prevVoted.length === 0;
          return {
            ...p,
            options: optionsUpdated,
            myVotes: [optionId],
            progress: {
              ...p.progress,
              voted: wasVoting ? p.progress.voted + 1 : p.progress.voted,
            },
          };
        });
        snapshots.push([key, polls]);
        qc.setQueryData(key, updated);
      }

      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      // Відкочуємо при помилці
      context?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: (poll) => {
      if (poll) qc.invalidateQueries({ queryKey: ['polls', poll.roomId] });
    },
  });
}

export function useToggleVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      pollsApi.toggleVote(pollId, optionId),
    onMutate: async ({ pollId, optionId }) => {
      await qc.cancelQueries({ queryKey: ['polls'] });
      const queries = qc.getQueriesData<PollDetails[]>({ queryKey: ['polls'] });
      const snapshots: [readonly unknown[], PollDetails[] | undefined][] = [];

      for (const [key, polls] of queries) {
        if (!polls) continue;
        const updated = polls.map((p) => {
          if (p.id !== pollId) return p;
          const hadVote = p.myVotes.includes(optionId);
          const optionsUpdated = p.options.map((o) =>
            o.id === optionId ? { ...o, votes: hadVote ? o.votes - 1 : o.votes + 1 } : o,
          );
          const myVotesUpdated = hadVote
            ? p.myVotes.filter((id) => id !== optionId)
            : [...p.myVotes, optionId];
          // Прогрес рахує тих, хто проголосував хоч за щось
          const willHaveAny = myVotesUpdated.length > 0;
          const hadAny = p.myVotes.length > 0;
          let voted = p.progress.voted;
          if (!hadAny && willHaveAny) voted += 1;
          if (hadAny && !willHaveAny) voted -= 1;
          return {
            ...p,
            options: optionsUpdated,
            myVotes: myVotesUpdated,
            progress: { ...p.progress, voted },
          };
        });
        snapshots.push([key, polls]);
        qc.setQueryData(key, updated);
      }

      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: (poll) => {
      if (poll) qc.invalidateQueries({ queryKey: ['polls', poll.roomId] });
    },
  });
}

// === Адмін-дії ===

export function useClosePoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pollId: string) => pollsApi.close(pollId),
    onSuccess: (poll) => qc.invalidateQueries({ queryKey: ['polls', poll.roomId] }),
  });
}

export function useReopenPoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pollId: string) => pollsApi.reopen(pollId),
    onSuccess: (poll) => qc.invalidateQueries({ queryKey: ['polls', poll.roomId] }),
  });
}

export function useApprovePoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pollId, optionIds }: { pollId: string; optionIds: string[] }) =>
      pollsApi.approve(pollId, optionIds),
    onSuccess: (poll) => {
      qc.invalidateQueries({ queryKey: ['polls', poll.roomId] });
      qc.invalidateQueries({ queryKey: ['final-plan', poll.roomId] });
    },
  });
}

export function useAssignOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ optionId, userId }: { optionId: string; userId: string | null }) =>
      pollsApi.assignOption(optionId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['polls'] }),
  });
}
