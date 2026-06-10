import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center px-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 28, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.95, y: 16, filter: 'blur(6px)' }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="glass-surface rounded-2xl shadow-2xl w-full max-w-md p-6 font-body"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-neutral-900 mb-4">
          {t('rooms.joinByCode')}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              {t('rooms.inviteCode')}
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-100 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition uppercase tracking-wider font-mono"
              placeholder="ABCD1234"
              {...register('inviteCode', {
                required: true,
                minLength: { value: 6, message: '' },
              })}
            />
            {errors.inviteCode && (
              <p className="text-red-500 text-xs mt-1">{t('rooms.inviteCode')}</p>
            )}
          </div>

          {joinRoom.isError && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">
              {t('common.error')}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 glass-btn py-2.5"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={joinRoom.isPending}
              className="flex-1 bg-warm-gradient hover:bg-warm-gradient-hover disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
            >
              {joinRoom.isPending ? t('common.loading') : t('rooms.join')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}