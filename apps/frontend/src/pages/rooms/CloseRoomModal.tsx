import { useTranslation } from 'react-i18next';
import { useCloseRoom } from '../../shared/api/rooms.hooks';

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
    <div
      className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center px-4 z-50"
      onClick={closeRoom.isPending ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 font-body"
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
          <p className="text-sm text-neutral-700 bg-neutral-50 rounded-lg px-3 py-2 mb-4 animate-pulse">
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
            className="flex-1 border border-neutral-100 text-neutral-700 font-semibold py-2.5 rounded-xl hover:bg-neutral-50 disabled:opacity-60 transition"
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
      </div>
    </div>
  );
}
