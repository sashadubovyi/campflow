import { useState } from 'react';
import {
  useVote,
  useToggleVote,
  useClosePoll,
  useReopenPoll,
  useApprovePoll,
  useAssignOption,
} from '../../../shared/api/polls.hooks';
import type { PollDetails, PollOption } from '../../../shared/api/polls.api';
import type { RoomMember } from '../../../shared/api/rooms.api';
import { Avatar } from '../../../shared/ui/Avatar';
import { LocationMap } from '../../../shared/ui/map/LocationMap';

interface Props {
  poll: PollDetails;
  isAdmin: boolean;
  members: RoomMember[];
  currentUserId: string;
}

// Кольорова стрічка статусу
function StatusBadge({ status }: { status: PollDetails['status'] }) {
  const styles: Record<PollDetails['status'], string> = {
    open: 'bg-forest-50 text-forest-700',
    reopened: 'bg-forest-50 text-forest-700',
    closed: 'bg-forest-100 text-forest-500',
    approved: 'bg-ember-500/10 text-ember-500',
  };
  const labels: Record<PollDetails['status'], string> = {
    open: 'Відкрите',
    reopened: 'Перевідкрите',
    closed: 'Закрите',
    approved: 'Затверджене',
  };
  return (
    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// Прогрес-бар голосу серед інших опцій
function ProgressBar({ percent, isWinning }: { percent: number; isWinning: boolean }) {
  return (
    <div className="h-1.5 bg-forest-50 rounded-full overflow-hidden mt-1">
      <div
        className={`h-full ${isWinning ? 'bg-ember-500' : 'bg-forest-500'} transition-all`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function PollCard({ poll, isAdmin, members, currentUserId }: Props) {
  const isClosed = poll.status === 'closed' || poll.status === 'approved';
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const maxVotes = Math.max(...poll.options.map((o) => o.votes), 0);

  return (
    <article className="bg-white rounded-xl border border-forest-100 p-3 shadow-sm">
      {/* Шапка */}
      <header className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-semibold text-forest-900 leading-tight">
            {poll.title}
          </h3>
          {poll.description && (
            <p className="text-xs text-forest-700 mt-0.5 line-clamp-2">{poll.description}</p>
          )}
        </div>
        <StatusBadge status={poll.status} />
      </header>

      {/* Прогрес */}
      <p className="text-[10px] text-forest-500 font-medium mb-3">
        {poll.progress.voted} з {poll.progress.total} проголосували
      </p>

      {/* Тіло картки залежно від типу */}
      {poll.type === 'single_choice' && (
        <SingleView poll={poll} isClosed={isClosed} maxVotes={maxVotes} totalVotes={totalVotes} />
      )}
      {poll.type === 'multi_choice' && (
        <MultiView
          poll={poll}
          isClosed={isClosed}
          maxVotes={maxVotes}
          totalVotes={totalVotes}
          members={members}
          currentUserId={currentUserId}
        />
      )}
      {poll.type === 'location' && (
        <LocationView poll={poll} isClosed={isClosed} maxVotes={maxVotes} totalVotes={totalVotes} />
      )}

      {/* Адмін-панель */}
      {isAdmin && <AdminActions poll={poll} />}
    </article>
  );
}

// === Single-choice view ===

function SingleView({
  poll,
  isClosed,
  maxVotes,
  totalVotes,
}: {
  poll: PollDetails;
  isClosed: boolean;
  maxVotes: number;
  totalVotes: number;
}) {
  const vote = useVote();

  return (
    <ul className="space-y-1.5">
      {poll.options.map((opt) => {
        const isChosen = poll.myVotes.includes(opt.id);
        const isWinning = opt.votes === maxVotes && opt.votes > 0;
        const percent = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;

        return (
          <li key={opt.id}>
            <button
              type="button"
              disabled={isClosed || vote.isPending}
              onClick={() => vote.mutate({ pollId: poll.id, optionId: opt.id })}
              className={`w-full text-left px-3 py-2 rounded-lg border transition disabled:cursor-default ${
                isChosen
                  ? 'border-forest-500 bg-forest-50'
                  : 'border-forest-100 hover:border-forest-500/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-forest-900 truncate">{opt.label}</span>
                <span className="text-xs text-forest-700 font-semibold shrink-0">{opt.votes}</span>
              </div>
              {totalVotes > 0 && <ProgressBar percent={percent} isWinning={isWinning} />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// === Multi-choice view (з призначенням) ===

function MultiView({
  poll,
  isClosed,
  maxVotes,
  totalVotes,
  members,
  currentUserId,
}: {
  poll: PollDetails;
  isClosed: boolean;
  maxVotes: number;
  totalVotes: number;
  members: RoomMember[];
  currentUserId: string;
}) {
  const toggleVote = useToggleVote();
  const assign = useAssignOption();
  const [assigningId, setAssigningId] = useState<string | null>(null);

  function handleAssign(optionId: string, userId: string | null) {
    assign.mutate({ optionId, userId });
    setAssigningId(null);
  }

  return (
    <ul className="space-y-1.5">
      {poll.options.map((opt) => {
        const isChosen = poll.myVotes.includes(opt.id);
        const isWinning = opt.votes === maxVotes && opt.votes > 0;
        const percent = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;

        return (
          <li key={opt.id} className="bg-forest-50 rounded-lg p-2">
            <button
              type="button"
              disabled={isClosed || toggleVote.isPending}
              onClick={() => toggleVote.mutate({ pollId: poll.id, optionId: opt.id })}
              className="w-full text-left"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    isChosen ? 'border-forest-500 bg-forest-500' : 'border-forest-100 bg-white'
                  }`}
                >
                  {isChosen && <span className="text-white text-[10px]">✓</span>}
                </span>
                <span className="text-sm text-forest-900 flex-1 truncate">{opt.label}</span>
                <span className="text-xs text-forest-700 font-semibold shrink-0">{opt.votes}</span>
              </div>
              {totalVotes > 0 && <ProgressBar percent={percent} isWinning={isWinning} />}
            </button>

            {/* Закріплення за учасником */}
            {poll.allowAssign && (
              <div className="mt-1.5 pl-6">
                {opt.assignedTo ? (
                  <button
                    type="button"
                    onClick={() =>
                      opt.assignedTo?.id === currentUserId
                        ? handleAssign(opt.id, null)
                        : setAssigningId(opt.id === assigningId ? null : opt.id)
                    }
                    className="flex items-center gap-1.5 text-xs text-forest-700 hover:text-forest-900 transition"
                  >
                    <Avatar
                      fullName={opt.assignedTo.fullName}
                      avatarUrl={opt.assignedTo.avatarUrl}
                      size={18}
                    />
                    <span className="truncate">{opt.assignedTo.fullName}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAssigningId(opt.id === assigningId ? null : opt.id)}
                    className="text-xs text-forest-500 hover:text-forest-700"
                  >
                    + закріпити за…
                  </button>
                )}

                {assigningId === opt.id && (
                  <div className="mt-1.5 bg-white border border-forest-100 rounded-lg p-1.5 space-y-0.5">
                    {members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleAssign(opt.id, m.user.id)}
                        className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-forest-50 transition text-left"
                      >
                        <Avatar fullName={m.user.fullName} avatarUrl={m.user.avatarUrl} size={20} />
                        <span className="text-xs text-forest-900">{m.user.fullName}</span>
                      </button>
                    ))}
                    {opt.assignedTo && (
                      <button
                        type="button"
                        onClick={() => handleAssign(opt.id, null)}
                        className="w-full text-left px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded"
                      >
                        Зняти призначення
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// === Location view (поки список без карти) ===

function LocationView({
  poll,
  isClosed,
  maxVotes,
  totalVotes,
}: {
  poll: PollDetails;
  isClosed: boolean;
  maxVotes: number;
  totalVotes: number;
}) {
  const vote = useVote();

  // Конвертуємо опції в формат MapPoint для карти
  const mapPoints = poll.options
    .filter((o) => o.latitude !== null && o.longitude !== null)
    .map((o) => ({
      id: o.id,
      label: o.label,
      address: o.address,
      latitude: o.latitude!,
      longitude: o.longitude!,
      votes: o.votes,
      isWinning: o.votes === maxVotes && o.votes > 0,
    }));

  return (
    <div className="space-y-2">
      <LocationMap points={mapPoints} height={180} />
      <ul className="space-y-1.5">
        {poll.options.map((opt) => {
          const isChosen = poll.myVotes.includes(opt.id);
          const isWinning = opt.votes === maxVotes && opt.votes > 0;
          const percent = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;

          return (
            <li key={opt.id}>
              <button
                type="button"
                disabled={isClosed || vote.isPending}
                onClick={() => vote.mutate({ pollId: poll.id, optionId: opt.id })}
                className={`w-full text-left px-3 py-2 rounded-lg border transition disabled:cursor-default ${
                  isChosen
                    ? 'border-forest-500 bg-forest-50'
                    : 'border-forest-100 hover:border-forest-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-forest-900 truncate">📍 {opt.label}</p>
                    {opt.address && (
                      <p className="text-[10px] text-forest-500 truncate">{opt.address}</p>
                    )}
                  </div>
                  <span className="text-xs text-forest-700 font-semibold shrink-0">
                    {opt.votes}
                  </span>
                </div>
                {totalVotes > 0 && <ProgressBar percent={percent} isWinning={isWinning} />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// === Адмін-дії ===

function AdminActions({ poll }: { poll: PollDetails }) {
  const closePoll = useClosePoll();
  const reopenPoll = useReopenPoll();
  const approve = useApprovePoll();
  const [pickingWinner, setPickingWinner] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function handleApprove() {
    if (selectedIds.size === 0) return;
    approve.mutate({ pollId: poll.id, optionIds: [...selectedIds] });
    setPickingWinner(false);
    setSelectedIds(new Set());
  }

  return (
    <div className="mt-3 pt-3 border-t border-forest-100">
      {poll.status === 'open' || poll.status === 'reopened' ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => closePoll.mutate(poll.id)}
            disabled={closePoll.isPending}
            className="flex-1 text-xs bg-forest-50 hover:bg-forest-100 text-forest-700 font-semibold py-1.5 rounded-lg transition"
          >
            Закрити
          </button>
        </div>
      ) : poll.status === 'closed' ? (
        <div className="space-y-2">
          {!pickingWinner ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => reopenPoll.mutate(poll.id)}
                className="flex-1 text-xs bg-forest-50 hover:bg-forest-100 text-forest-700 font-semibold py-1.5 rounded-lg transition"
              >
                Перевідкрити
              </button>
              <button
                type="button"
                onClick={() => setPickingWinner(true)}
                className="flex-1 text-xs bg-ember-500 hover:bg-ember-400 text-white font-semibold py-1.5 rounded-lg transition"
              >
                Затвердити →
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[10px] text-forest-500">Оберіть переможця(-ів):</p>
              <div className="space-y-1">
                {poll.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleSelect(opt.id)}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition ${
                      selectedIds.has(opt.id)
                        ? 'bg-ember-500/10 text-ember-500 font-semibold'
                        : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                    }`}
                  >
                    {selectedIds.has(opt.id) ? '✓ ' : ''}
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPickingWinner(false);
                    setSelectedIds(new Set());
                  }}
                  className="flex-1 text-xs text-forest-500 py-1.5"
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={selectedIds.size === 0 || approve.isPending}
                  className="flex-1 text-xs bg-ember-500 hover:bg-ember-400 disabled:opacity-50 text-white font-semibold py-1.5 rounded-lg transition"
                >
                  Затвердити
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[10px] text-ember-500 text-center font-semibold">
          ⭐ Додано у Фінальний план
        </p>
      )}
    </div>
  );
}

// для TS — щоб не падати на `as const` нагорі, якщо колись приберемо
type _Option = PollOption;
