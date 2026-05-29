import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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

const TYPE_LABELS: Record<PollType, { label: string; emoji: string; hint: string }> = {
  single_choice: {
    label: 'Один вибір',
    emoji: '📅',
    hint: 'Дата, напрямок — один голос на учасника',
  },
  multi_choice: {
    label: 'Чек-лист',
    emoji: '✅',
    hint: 'Список речей — можна обрати кілька, призначити відповідального',
  },
  location: {
    label: 'Локація',
    emoji: '📍',
    hint: 'Точки на мапі — клікніть на карту, додайте назву',
  },
};

export function CreatePollModal({ roomId, onClose }: Props) {
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

  function handleMapPick(loc: PickedLocation) {
    setPendingPick(loc);
    // Підставимо коротку адресу як попередню назву
    if (loc.address) {
      const short = loc.address.split(',').slice(0, 2).join(',').trim();
      setPendingLabel(short);
    }
  }

  function confirmLocationDraft() {
    if (!pendingPick) return;
    const label = pendingLabel.trim();
    if (!label) {
      alert('Введіть назву точки');
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
          alert('Додайте хоча б 2 точки на карті');
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

  return (
    <div
      className="fixed inset-0 bg-forest-900/40 flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 font-body max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-forest-900 mb-4">Нове опитування</h2>

        {/* Вибір типу */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {(Object.keys(TYPE_LABELS) as PollType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`p-3 rounded-xl border-2 transition text-left ${
                type === t
                  ? 'border-forest-500 bg-forest-50'
                  : 'border-forest-100 hover:border-forest-500/50'
              }`}
            >
              <div className="text-xl mb-1">{TYPE_LABELS[t].emoji}</div>
              <div className="text-xs font-semibold text-forest-900">{TYPE_LABELS[t].label}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-forest-500 mb-5 italic">{TYPE_LABELS[type].hint}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">Питання</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition"
              placeholder={
                type === 'single_choice'
                  ? 'Коли їдемо?'
                  : type === 'multi_choice'
                    ? 'Що беремо в дорогу?'
                    : 'Куди заїдемо?'
              }
              {...register('title', {
                required: 'Введіть питання',
                minLength: { value: 2, message: 'Мінімум 2 символи' },
              })}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">
              Опис <span className="text-forest-500 font-normal">(необов'язково)</span>
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
              <span className="text-sm text-forest-700">
                Дозволити закріпити пункт за учасником
              </span>
            </label>
          )}

          {/* Варіанти для single/multi */}
          {type !== 'location' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-forest-700">Варіанти</label>
                <button
                  type="button"
                  onClick={() => append({ label: '' })}
                  className="text-xs text-forest-600 hover:text-forest-900 font-semibold"
                >
                  + Додати варіант
                </button>
              </div>
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      placeholder={`Варіант ${idx + 1}`}
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

          {/* Карта для location */}
          {type === 'location' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-forest-700">Точки на мапі</label>
              <MapPicker onPick={handleMapPick} />

              {pendingPick && (
                <div className="bg-forest-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs text-forest-700">
                    📍 Точка обрана: {pendingPick.latitude.toFixed(4)},{' '}
                    {pendingPick.longitude.toFixed(4)}
                  </p>
                  {pendingPick.address && (
                    <p className="text-[10px] text-forest-500 truncate">{pendingPick.address}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={pendingLabel}
                      onChange={(e) => setPendingLabel(e.target.value)}
                      placeholder="Назва точки"
                      className="flex-1 px-3 py-2 rounded-lg border border-forest-100 focus:border-forest-500 outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={confirmLocationDraft}
                      className="bg-forest-600 hover:bg-forest-700 text-white font-semibold px-4 rounded-lg text-sm transition"
                    >
                      Додати
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
                <p className="text-xs text-forest-500 italic">
                  Додайте мінімум 2 точки, щоб було за що голосувати.
                </p>
              )}
            </div>
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
              disabled={isLoading}
              className="flex-1 bg-forest-600 hover:bg-forest-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
            >
              {isLoading ? 'Створення…' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
