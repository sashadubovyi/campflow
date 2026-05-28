import { useForm } from 'react-hook-form';
import { useJoinRoom } from '../../shared/api/rooms.hooks';

interface Props {
  onClose: () => void;
  onJoined: (roomId: string) => void;
}

interface FormValues {
  inviteCode: string;
}

export function JoinRoomModal({ onClose, onJoined }: Props) {
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
    <div
      className="fixed inset-0 bg-forest-900/40 flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 font-body"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-forest-900 mb-4">
          Приєднатися за кодом
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">
              Код запрошення
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition uppercase tracking-wider font-mono"
              placeholder="ABCD1234"
              {...register('inviteCode', {
                required: 'Введіть код',
                minLength: { value: 6, message: 'Код закороткий' },
              })}
            />
            {errors.inviteCode && (
              <p className="text-red-500 text-xs mt-1">{errors.inviteCode.message}</p>
            )}
          </div>

          {joinRoom.isError && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">
              Невірний код або ви вже учасник
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-forest-100 text-forest-700 font-semibold py-2.5 rounded-xl hover:bg-forest-50 transition"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={joinRoom.isPending}
              className="flex-1 bg-ember-500 hover:bg-ember-400 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
            >
              {joinRoom.isPending ? 'Приєднання…' : 'Приєднатися'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
