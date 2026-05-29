import { useState } from 'react';
import { usePolls } from '../../shared/api/polls.hooks';
import type { RoomMember } from '../../shared/api/rooms.api';
import { PollCard } from './polls/PollCard';
import { CreatePollModal } from './polls/CreatePollModal';

interface Props {
  roomId: string;
  isAdmin: boolean;
  members: RoomMember[];
  currentUserId: string;
}

export function PollsPanel({ roomId, isAdmin, members, currentUserId }: Props) {
  const { data: polls, isLoading } = usePolls(roomId);
  const [showCreate, setShowCreate] = useState(false);

  // Сортуємо: відкриті/перевідкриті — нагору, закриті/затверджені — донизу
  const sorted = [...(polls ?? [])].sort((a, b) => {
    const order: Record<string, number> = {
      open: 0,
      reopened: 1,
      closed: 2,
      approved: 3,
    };
    const diff = (order[a.status] ?? 99) - (order[b.status] ?? 99);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <aside className="h-full bg-white border-l border-forest-100 flex flex-col">
      {/* Шапка */}
      <div className="px-4 py-3 border-b border-forest-100 flex items-center justify-between shrink-0">
        <h2 className="font-display text-sm uppercase tracking-widest text-forest-500">
          Голосування
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="text-xs bg-forest-600 hover:bg-forest-700 text-white font-semibold px-3 py-1 rounded-lg transition"
        >
          + Створити
        </button>
      </div>

      {/* Список */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {isLoading && (
          <p className="text-center text-forest-500 font-body text-sm animate-pulse">
            Завантаження…
          </p>
        )}

        {!isLoading && sorted.length === 0 && (
          <div className="text-center text-forest-500 font-body text-sm py-8">
            <p className="text-2xl mb-2">🗳️</p>
            <p>Поки що порожньо.</p>
            <p className="text-xs mt-1 text-forest-700">
              Створіть перше опитування — про дати, локацію або речі.
            </p>
          </div>
        )}

        {sorted.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            isAdmin={isAdmin}
            members={members}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {showCreate && (
        <CreatePollModal roomId={roomId} onClose={() => setShowCreate(false)} />
      )}
    </aside>
  );
}