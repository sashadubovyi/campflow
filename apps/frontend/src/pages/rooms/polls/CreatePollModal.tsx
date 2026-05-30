import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  useCreateSinglePoll,
  useCreateMultiPoll,
  useCreateLocationPoll,
} from '../../../shared/api/polls.hooks';
import type { PollType } from '../../../shared/api/polls.api';
import { MapPicker, type PickedLocation } from '../../../shared/ui/map/MapPicker';

interface Props {
  roomId: string;
  onClose: () => void;
}

interface BaseFormValues {
  title: string;
  description?: string;
  allowAssign?: boolean;
  options: { label: string }[];
}

interface LocationDraft {
  label: string;
  latitude: number;
  longitude: number;
  address?: string;
}

const TYPE_EMOJI: Record<PollType, string> = {
  single_choice: '📅',
  multi_choice: '✅',
  location: '📍',
};

export function CreatePollModal({ roomId, onClose }: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState<PollType>('single_choice');
  const [locationDrafts, setLocationDrafts] = useState<LocationDraft[]>([]);
  const [pendingPick, setPendingPick] = useState<PickedLocation | null>(null);
  const [pendingLabel, setPendingLabel] = useState('');

  const createSingle = useCreateSinglePoll();
  const createMulti = useCreateMultiPoll();
  const createLocation = useCreateLocationPoll();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BaseFormValues>({
    defaultValues: {
      title: '',
      description: '',
      allowAssign: false,
      options: [{ label: '' }, { label: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'options' });

  const isLoading = createSingle.isPending || createMulti.isPending || createLocation.isPending;

  function getTypeLabel(t: PollType): string {
    if (t === 'single_choice') return 'singleChoice';
    if (t === 'multi_choice') return 'multiChoice';
    return 'location';
  }

  function handleMapPick(loc: PickedLocation) {
    setPendingPick(loc);
    if (loc.address) {
      const short = loc.address.split(',').slice(0, 2).join(',').trim();
      setPendingLabel(short);
    }
  }

  function confirmLocationDraft() {
    if (!pendingPick) return;
    const label = pendingLabel.trim();
    if (!label) {
      alert(t('polls.pointName'));
      return;
    }
    setLocationDrafts((prev) => [
      ...prev,
      {
        label,
        latitude: pendingPick.latitude,
        longitude: pendingPick.longitude,
        address: pendingPick.address,
      },
    ]);
    setPendingPick(null);
    setPendingLabel('');
  }

  function removeLocationDraft(idx: number) {
    setLocationDrafts((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(values: BaseFormValues) {
    try {
      if (type === 'single_choice') {
        const opts = values.options
          .map((o) => ({ label: o.label.trim() }))
          .filter((o) => o.label.length > 0);
        if (opts.length < 2) return;
        await createSingle.mutateAsync({
          roomId,
          title: values.title.trim(),
          description: values.description?.trim() || undefined,
          options: opts,
        });
      } else if (type === 'multi_choice') {
        const opts = values.options
          .map((o) => ({ label: o.label.trim() }))
          .filter((o) => o.label.length > 0);
        if (opts.length < 2) return;
        await createMulti.mutateAsync({
          roomId,
          title: values.title.trim(),
          description: values.description?.trim() || undefined,
          allowAssign: values.allowAssign,
          options: opts,
        });
      } else {
        if (locationDrafts.length < 2) {
          alert(t('polls.addMinPoints'));
          return;
        }
        await createLocation.mutateAsync({
          roomId,
          title: values.title.trim(),
          description: values.description?.trim() || undefined,
          options: locationDrafts,
        });
      }
      onClose();
    } catch {
      // помилка через мутацію
    }
  }

  const pollTypes: PollType[] = ['single_choice', 'multi_choice', 'location'];

  return (
    <div
      className="fixed inset-0 bg-forest-900/40 flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 font-body max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-forest-900 mb-4">
          {t('polls.newPoll')}
        </h2>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {pollTypes.map((pt) => (
            <button
              key={pt}
              type="button"
              onClick={() => setType(pt)}
              className={`p-3 rounded-xl border-2 transition text-left ${
                type === pt
                  ? 'border-forest-500 bg-forest-50'
                  : 'border-forest-100 hover:border-forest-500/50'
              }`}
            >
              <div className="text-xl mb-1">{TYPE_EMOJI[pt]}</div>
              <div className="text-xs font-semibold text-forest-900">
                {t(`polls.types.${getTypeLabel(pt)}`)}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-forest-500 mb-5 italic">
          {t(`polls.types.${getTypeLabel(type)}Hint`)}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">
              {t('polls.question')}
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition"
              {...register('title', {
                required: true,
                minLength: { value: 2, message: '' },
              })}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{t('polls.question')}</p>
            )}
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

          {type === 'multi_choice' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <Controller
                name="allowAssign"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4 accent-forest-600"
                  />
                )}
              />
              <span className="text-sm text-forest-700">{t('polls.allowAssign')}</span>
            </label>
          )}

          {type !== 'location' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-forest-700">
                  {t('polls.options')}
                </label>
                <button
                  type="button"
                  onClick={() => append({ label: '' })}
                  className="text-xs text-forest-600 hover:text-forest-900 font-semibold"
                >
                  {t('polls.addOption')}
                </button>
              </div>
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      placeholder={`${idx + 1}`}
                      className="flex-1 px-3 py-2 rounded-lg border border-forest-100 focus:border-forest-500 outline-none text-sm"
                      {...register(`options.${idx}.label` as const)}
                    />
                    {fields.length > 2 && (
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="text-red-500 hover:text-red-700 text-sm px-2"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === 'location' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-forest-700">
                {t('polls.mapHint')}
              </label>
              <MapPicker onPick={handleMapPick} />

              {pendingPick && (
                <div className="bg-forest-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs text-forest-700">
                    {t('polls.pointSelected')}: {pendingPick.latitude.toFixed(4)},{' '}
                    {pendingPick.longitude.toFixed(4)}
                  </p>
                  {pendingPick.address && (
                    <p className="text-[10px] text-forest-500 truncate">{pendingPick.address}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={pendingLabel}
                      onChange={(e) => setPendingLabel(e.target.value)}
                      placeholder={t('polls.pointName')}
                      className="flex-1 px-3 py-2 rounded-lg border border-forest-100 focus:border-forest-500 outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={confirmLocationDraft}
                      className="bg-forest-600 hover:bg-forest-700 text-white font-semibold px-4 rounded-lg text-sm transition"
                    >
                      {t('polls.addPoint')}
                    </button>
                  </div>
                </div>
              )}

              {locationDrafts.length > 0 && (
                <ul className="space-y-1.5">
                  {locationDrafts.map((d, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-2 bg-white border border-forest-100 rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-forest-900 truncate">{d.label}</p>
                        <p className="text-[10px] text-forest-500 font-mono">
                          {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLocationDraft(idx)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {locationDrafts.length < 2 && (
                <p className="text-xs text-forest-500 italic">{t('polls.addMinPoints')}</p>
              )}
            </div>
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
              disabled={isLoading}
              className="flex-1 bg-forest-600 hover:bg-forest-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
            >
              {isLoading ? t('common.creating') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}