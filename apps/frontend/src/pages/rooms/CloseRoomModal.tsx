import { useTranslation } from 'react-i18next';
import { m } from 'framer-motion';
import { useCloseRoom } from '../../shared/api/rooms.hooks';

const spring = { type: 'spring', duration: 0.15, bounce: 0.12 } as const;

interface Props {
  roomId: string;
  roomName: string;
  onClose: () => void;
  onClosed: () => void;
}

export function CloseRoomModal({ roomId, roomName, onClose, onClosed }: Props) {
  const { t } = useTranslation();
  const closeRoom = useCloseRoom(roomId);

  async function handleSubmit() {
    try {
      await closeRoom.mutateAsync();
      onClosed();
    } catch {
      // error shown below; modal stays open
    }
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.06 }}
      className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center px-4 z-50 backdrop-blur-sm"
      onClick={closeRoom.isPending ? undefined : onClose}
    >
      <m.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={spring}
        className="glass-surface rounded-2xl shadow-2xl w-full max-w-md p-6 font-body"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-neutral-900 mb-2">
          {t('polls.ai.closeRoomConfirm')}
        </h2>
        <p className="font-display text-sm text-neutral-700 mb-3">«{roomName}»</p>
        <p className="text-sm text-neutral-700 mb-5 leading-relaxed">
          {t('polls.ai.closeRoomDescription')}
        </p>

        {closeRoom.isPending && (
          <p className="text-sm text-neutral-700 bg-white/40 backdrop-blur-sm rounded-2xl px-3 py-2 mb-4 animate-pulse">
            {t('polls.ai.summarizing')}
          </p>
        )}

        {closeRoom.isError && (
          <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2 mb-4">
            {t('common.error')}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={closeRoom.isPending}
            className="flex-1 glass-btn py-2.5 disabled:opacity-60"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={closeRoom.isPending}
            className="flex-1 bg-danger-gradient hover:bg-danger-gradient-hover disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition"
          >
            {closeRoom.isPending ? t('polls.ai.summarizing') : t('polls.ai.closeRoomAction')}
          </button>
        </div>
      </m.div>
    </m.div>
  );
}
