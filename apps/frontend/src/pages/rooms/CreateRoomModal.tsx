import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useCreateRoom } from '../../shared/api/rooms.hooks';

interface Props {
  onClose: () => void;
  onCreated: (roomId: string) => void;
}

interface FormValues {
  name: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
}

export function CreateRoomModal({ onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const createRoom = useCreateRoom();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    const room = await createRoom.mutateAsync({
      name: values.name,
      description: values.description || undefined,
      startsAt: values.startsAt || undefined,
      endsAt: values.endsAt || undefined,
    });
    onCreated(room.id);
  }

  return (
    <div
      className="fixed inset-0 bg-forest-900/40 flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 font-body"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-forest-900 mb-4">
          {t('rooms.newRoom')}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">
              {t('rooms.roomName')}
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition"
              {...register('name', {
                required: true,
                minLength: { value: 2, message: '' },
              })}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{t('rooms.roomName')}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">
              {t('rooms.descriptionOptional')}
            </label>
            <textarea
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition resize-none"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">
                {t('rooms.startsAt')}
              </label>
              <input
                type="date"
                className="w-full px-3 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 outline-none transition"
                {...register('startsAt')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">
                {t('rooms.endsAt')}
              </label>
              <input
                type="date"
                className="w-full px-3 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 outline-none transition"
                {...register('endsAt')}
              />
            </div>
          </div>

          {createRoom.isError && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">
              {t('common.error')}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-forest-100 text-forest-700 font-semibold py-2.5 rounded-xl hover:bg-forest-50 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createRoom.isPending}
              className="flex-1 bg-forest-600 hover:bg-forest-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
            >
              {createRoom.isPending ? t('common.creating') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
