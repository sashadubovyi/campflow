import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { m } from 'framer-motion';
import { Sparkles, Pencil } from 'lucide-react';
import type { RoomDraft } from '../../shared/api/ai-rooms.api';
import { ManualRoomForm } from './create-room/ManualRoomForm';
import { AiRoomInput } from './create-room/AiRoomInput';
import { AiRoomPreview } from './create-room/AiRoomPreview';
import { cn } from '../../shared/ui';

interface Props {
  onClose: () => void;
  onCreated: (roomId: string) => void;
}

type Mode = 'manual' | 'ai';
type Step = 'input' | 'preview';

export function CreateRoomModal({ onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('manual');
  const [step, setStep] = useState<Step>('input');
  const [draft, setDraft] = useState<RoomDraft | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleDraft(d: RoomDraft) {
    setDraft(d);
    setStep('preview');
  }

  function switchMode(m: Mode) {
    setMode(m);
    setStep('input');
    setDraft(null);
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center px-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <m.div
        initial={{ opacity: 0, scale: 0.92, y: 28, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.95, y: 16, filter: 'blur(6px)' }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="glass-surface rounded-2xl shadow-2xl w-full max-w-md p-6 font-body max-h-[90vh] overflow-y-auto scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-neutral-900 mb-4">
          {t('rooms.newRoom')}
        </h2>

        {/* Перемикач режиму */}
        <div className="flex gap-1.5 mb-5 bg-white/35 border border-white/50 backdrop-blur-md p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => switchMode('manual')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition',
              mode === 'manual'
                ? 'bg-white/85 border border-white/90 text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700',
            )}
          >
            <Pencil size={14} />
            {t('rooms.createManual')}
          </button>
          <button
            type="button"
            onClick={() => switchMode('ai')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition',
              mode === 'ai'
                ? 'bg-white/85 border border-white/90 text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700',
            )}
          >
            <Sparkles size={14} />
            {t('rooms.createAi')}
          </button>
        </div>

        {mode === 'manual' && (
          <ManualRoomForm onClose={onClose} onCreated={onCreated} />
        )}
        {mode === 'ai' && step === 'input' && (
          <AiRoomInput onClose={onClose} onDraft={handleDraft} />
        )}
        {mode === 'ai' && step === 'preview' && draft && (
          <AiRoomPreview draft={draft} onBack={() => setStep('input')} onCreated={onCreated} />
        )}
      </m.div>
    </m.div>
  );
}
