import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usePolls } from '../../shared/api/polls.hooks';
import type { RoomMember } from '../../shared/api/rooms.api';
import { PollCard } from './polls/PollCard';
import { CreatePollModal } from './polls/CreatePollModal';
import { FinalPlanPanel } from './FinalPlanPanel';
import { cn } from '../../shared/ui';
import { Plus } from 'lucide-react';
import { BarChart2, ClipboardList } from 'lucide-react';

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
    const order: Record<string, number> = { open: 0, reopened: 1, closed: 2, approved: 3 };
    const diff = (order[a.status] ?? 99) - (order[b.status] ?? 99);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const tabCls = (active: boolean) =>
    cn(
      'flex-1 text-xs font-semibold py-1.5 rounded-lg transition flex items-center justify-center gap-1.5',
      active ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700',
    );

  return (
    <aside className="h-full bg-white flex flex-col min-h-0">
      <div className="px-2 pt-2 shrink-0 border-b border-neutral-100">
        <div className="flex gap-1 bg-white/35 border border-white/50 backdrop-blur-md p-1 rounded-2xl mb-2">
          <button onClick={() => setTab('polls')} className={tabCls(tab === 'polls')}>
            <BarChart2 size={14} />
            {t('polls.finalPlan.tabPolls')}
          </button>
          <button onClick={() => setTab('plan')} className={tabCls(tab === 'plan')}>
            <ClipboardList size={14} />
            {t('polls.finalPlan.tabPlan')}
          </button>
        </div>

        {tab === 'polls' && (
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-xs uppercase tracking-widest text-neutral-400">
              {t('polls.title')}
            </h2>
            <button
              onClick={() => setShowCreate(true)}
              className="w-16 h-7 flex items-center justify-center btn-glass-blue rounded-lg transition shrink-0"
              title={t('polls.createNew')}
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {tab === 'polls' && (
          <div className="px-3 py-3 space-y-3">
            {isLoading && (
              <p className="text-center text-neutral-400 text-sm animate-pulse">
                {t('common.loading')}
              </p>
            )}

            {!isLoading && sorted.length === 0 && (
              <div className="text-center text-neutral-400 text-sm py-8 flex flex-col items-center">
                <BarChart2 size={36} className="text-neutral-300 mb-2" />
                <p>{t('polls.empty')}</p>
                <p className="text-xs mt-1 text-neutral-500">{t('polls.emptyHint')}</p>
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

      <AnimatePresence>{showCreate && <CreatePollModal roomId={roomId} onClose={() => setShowCreate(false)} />}</AnimatePresence>
    </aside>
  );
}
