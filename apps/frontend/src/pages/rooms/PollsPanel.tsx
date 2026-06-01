import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePolls } from '../../shared/api/polls.hooks';
import type { RoomMember } from '../../shared/api/rooms.api';
import { PollCard } from './polls/PollCard';
import { CreatePollModal } from './polls/CreatePollModal';
import { FinalPlanPanel } from './FinalPlanPanel';

interface Props {
  roomId: string;
  isAdmin: boolean;
  members: RoomMember[];
  currentUserId: string;
}

type Tab = 'polls' | 'plan';

export function PollsPanel({ roomId, isAdmin, members, currentUserId }: Props) {
  const { t } = useTranslation();
  const { data: polls, isLoading } = usePolls(roomId);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<Tab>('polls');

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
      {/* Табочки */}
      <div className="px-2 pt-2 shrink-0 border-b border-forest-100">
        <div className="flex gap-1 bg-forest-50 p-1 rounded-xl mb-2">
          <button
            onClick={() => setTab('polls')}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition ${
              tab === 'polls'
                ? 'bg-white text-forest-900 shadow-sm'
                : 'text-forest-700 hover:text-forest-900'
            }`}
          >
            {t('polls.finalPlan.tabPolls')}
          </button>
          <button
            onClick={() => setTab('plan')}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition ${
              tab === 'plan'
                ? 'bg-white text-forest-900 shadow-sm'
                : 'text-forest-700 hover:text-forest-900'
            }`}
          >
            {t('polls.finalPlan.tabPlan')}
          </button>
        </div>

        {tab === 'polls' && (
          <div className="flex items-center justify-between pb-2">
            <h2 className="font-display text-xs uppercase tracking-widest text-forest-500">
              {t('polls.title')}
            </h2>
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs bg-forest-600 hover:bg-forest-700 text-white font-semibold px-3 py-1 rounded-lg transition"
            >
              {t('polls.createNew')}
            </button>
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'polls' && (
          <div className="px-3 py-3 space-y-3">
            {isLoading && (
              <p className="text-center text-forest-500 font-body text-sm animate-pulse">
                {t('common.loading')}
              </p>
            )}

            {!isLoading && sorted.length === 0 && (
              <div className="text-center text-forest-500 font-body text-sm py-8">
                <p className="text-2xl mb-2">🗳️</p>
                <p>{t('polls.empty')}</p>
                <p className="text-xs mt-1 text-forest-700">{t('polls.emptyHint')}</p>
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
        )}

        {tab === 'plan' && <FinalPlanPanel roomId={roomId} />}
      </div>

      {showCreate && <CreatePollModal roomId={roomId} onClose={() => setShowCreate(false)} />}
    </aside>
  );
}
