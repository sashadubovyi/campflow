import { useTranslation } from 'react-i18next';
import { Bot, Calendar } from 'lucide-react';
import type { RoomDraft } from '../../../shared/api/ai-rooms.api';
import { useAiRoomCommit } from '../../../shared/api/ai-rooms.hooks';
import { GlassButton } from '../../../shared/ui/GlassButton';
import { PollPreviewCard } from './PollPreviewCard';

interface Props {
  draft: RoomDraft;
  onBack: () => void;
  onCreated: (roomId: string) => void;
}

export function AiRoomPreview({ draft, onBack, onCreated }: Props) {
  const { t } = useTranslation();
  const commit = useAiRoomCommit();

  async function handleCommit() {
    const room = await commit.mutateAsync(draft);
    onCreated(room.id);
  }

  return (
    <div className="space-y-4">
      {/* Room info */}
      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
        <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">{t('rooms.roomName')}</p>
        <p className="font-semibold text-neutral-900">{draft.room.name}</p>
        {draft.room.description && (
          <p className="text-sm text-neutral-500 mt-1">{draft.room.description}</p>
        )}
        {draft.room.eventDate && (
          <p className="text-xs text-accent-600 mt-1.5 font-medium flex items-center gap-1"><Calendar size={11} />{draft.room.eventDate}</p>
        )}
      </div>

      {/* Polls */}
      {draft.polls.length > 0 && (
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wide mb-2">
            {t('rooms.aiPolls', { count: draft.polls.length })}
          </p>
          <div className="space-y-2">
            {draft.polls.map((poll, i) => (
              <PollPreviewCard key={i} poll={poll} index={i} />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-neutral-400 italic text-center">
        {t('rooms.aiPreviewHint')}
      </p>

      {commit.isError && (
        <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{t('common.error')}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 glass-btn py-2.5"
        >
          {t('common.back')}
        </button>
        <div className="flex-1">
          <GlassButton
            variant="ai"
            onClick={handleCommit}
            loading={commit.isPending}
            className="w-full py-2.5"
          >
            <Bot size={16} />
            {t('rooms.aiCreate')}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
