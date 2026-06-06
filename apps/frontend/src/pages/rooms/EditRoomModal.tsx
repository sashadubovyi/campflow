import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RoomDetails } from '../../shared/api/rooms.api';
import { useUpdateRoom } from '../../shared/api/rooms.hooks';

interface Props {
  room: RoomDetails;
  onClose: () => void;
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditRoomModal({ room, onClose }: Props) {
  const { t } = useTranslation();
  const updateRoom = useUpdateRoom(room.id);
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? '');
  const [startsAt, setStartsAt] = useState(toLocalInput(room.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(room.endsAt));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await updateRoom.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 font-body"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-neutral-900 mb-5">
          {t('rooms.editRoomTitle')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              {t('rooms.roomName')}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition text-sm"
              maxLength={120}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              {t('rooms.descriptionOptional')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition text-sm resize-none"
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                {t('rooms.startsAt')}
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                {t('rooms.endsAt')}
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition text-sm"
              />
            </div>
          </div>

          {updateRoom.isError && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">
              {t('common.error')}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-neutral-200 text-neutral-700 font-semibold py-2.5 rounded-xl hover:bg-neutral-50 transition text-sm"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={updateRoom.isPending || !name.trim()}
              className="flex-1 bg-brand-gradient hover:bg-brand-gradient-hover disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm"
            >
              {updateRoom.isPending ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
