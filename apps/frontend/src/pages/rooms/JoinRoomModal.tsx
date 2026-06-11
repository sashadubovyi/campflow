import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { m } from 'framer-motion';
import { useJoinRoom } from '../../shared/api/rooms.hooks';

interface Props {
  onClose: () => void;
  onJoined: (roomId: string) => void;
}

interface FormValues {
  inviteCode: string;
}

export function JoinRoomModal({ onClose, onJoined }: Props) {
  const { t } = useTranslation();
  const joinRoom = useJoinRoom();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    const room = await joinRoom.mutateAsync(values.inviteCode.trim().toUpperCase());
    onJoined(room.id);
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.06 }}
      className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center px-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <m.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', duration: 0.15, bounce: 0.12 }}
        className="glass-surface rounded-card-lg shadow-glass-panel w-full max-w-md p-6 font-body"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-neutral-900 mb-4">
          {t('rooms.joinByCode')}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              {t('rooms.inviteCode')}
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-2xl glass-input focus:ring-0 outline-none transition uppercase tracking-wider font-mono text-neutral-900"
              placeholder="ABCD1234"
              {...register('inviteCode', {
                required: true,
                minLength: { value: 6, message: '' },
              })}
            />
            {errors.inviteCode && (
              <p className="text-danger-700 text-xs mt-1.5">{t('rooms.inviteCode')}</p>
            )}
          </div>

          {joinRoom.isError && (
            <p className="text-danger-700 text-sm bg-danger-500/10 border border-danger-500/25 rounded-2xl px-3 py-2">
              {t('common.error')}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/55 border border-white/70 text-neutral-700 backdrop-blur-md rounded-2xl py-2.5 text-sm font-semibold transition hover:bg-white/72"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={joinRoom.isPending}
              className="flex-1 btn-glass-blue py-2.5 rounded-2xl font-semibold text-sm disabled:opacity-60"
            >
              {joinRoom.isPending ? t('common.loading') : t('rooms.join')}
            </button>
          </div>
        </form>
      </m.div>
    </m.div>
  );
}
