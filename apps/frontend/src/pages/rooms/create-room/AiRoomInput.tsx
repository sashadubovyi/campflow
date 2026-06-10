import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { useAiRoomDraft } from '../../../shared/api/ai-rooms.hooks';
import type { RoomDraft } from '../../../shared/api/ai-rooms.api';
import { GradientButton } from '../../../shared/ui/GradientButton';

interface Props {
  onClose: () => void;
  onDraft: (draft: RoomDraft) => void;
}

export function AiRoomInput({ onClose, onDraft }: Props) {
  const { t } = useTranslation();
  const aiDraft = useAiRoomDraft();
  const [prompt, setPrompt] = useState('');

  async function handleGenerate() {
    if (prompt.trim().length < 10) return;
    const result = await aiDraft.mutateAsync(prompt.trim());
    // Захист від кривого тіла відповіді: якщо backend з якоїсь причини
    // повернув не RoomDraft — не перемикаємось у preview, показуємо error.
    if (!result || !result.room) return;
    onDraft(result);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {t('rooms.aiPromptLabel')}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder={t('rooms.aiPromptPlaceholder')}
          className="w-full px-4 py-3 rounded-xl border border-neutral-100 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition resize-none text-sm"
        />
        <p className="text-xs text-neutral-400 mt-1">{prompt.trim().length}/1000</p>
      </div>

      {aiDraft.isError && (
        <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{t('common.error')}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 glass-btn py-2.5"
        >
          {t('common.cancel')}
        </button>
        <div className="flex-1">
          <GradientButton
            onClick={handleGenerate}
            loading={aiDraft.isPending}
            disabled={prompt.trim().length < 10}
            className="w-full py-2.5"
          >
            <Sparkles size={16} />
            {aiDraft.isPending ? t('rooms.aiGenerating') : t('rooms.aiGenerate')}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
