import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useCreateRoom } from '../../../shared/api/rooms.hooks';
import { roomsApi } from '../../../shared/api/rooms.api';
import { CoverUploadField } from '../CoverUploadField';

interface FormValues {
  name: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
}

interface Props {
  onClose: () => void;
  onCreated: (roomId: string) => void;
}

export function ManualRoomForm({ onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const createRoom = useCreateRoom();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    const room = await createRoom.mutateAsync({
      name: values.name,
      description: values.description || undefined,
      startsAt: values.startsAt || undefined,
      endsAt: values.endsAt || undefined,
    });
    if (coverFile) {
      setUploadingCover(true);
      try {
        await roomsApi.uploadCover(room.id, coverFile);
      } catch {
        // Cover upload failed silently — room is still created
      } finally {
        setUploadingCover(false);
      }
    }
    onCreated(room.id);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <CoverUploadField
        onFileSelected={setCoverFile}
        isUploading={uploadingCover}
      />
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {t('rooms.roomName')}
        </label>
        <input
          className="w-full px-4 py-2.5 rounded-xl border border-neutral-100 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition"
          {...register('name', { required: true, minLength: { value: 2, message: '' } })}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{t('rooms.roomName')}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {t('rooms.descriptionOptional')}
        </label>
        <textarea
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-neutral-100 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition resize-none"
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {t('rooms.startsAt')}
          </label>
          <input
            type="date"
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-100 focus:border-accent-500 outline-none transition text-neutral-700 [&::-webkit-calendar-picker-indicator]:opacity-40"
            {...register('startsAt')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {t('rooms.endsAt')}
          </label>
          <input
            type="date"
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-100 focus:border-accent-500 outline-none transition text-neutral-700 [&::-webkit-calendar-picker-indicator]:opacity-40"
            {...register('endsAt')}
          />
        </div>
      </div>

      {createRoom.isError && (
        <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{t('common.error')}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-neutral-100 text-neutral-700 font-semibold py-2.5 rounded-xl hover:bg-neutral-50 transition"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={createRoom.isPending}
          className="flex-1 bg-brand-gradient hover:bg-brand-gradient-hover disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
        >
          {createRoom.isPending ? t('common.creating') : t('common.create')}
        </button>
      </div>
    </form>
  );
}
