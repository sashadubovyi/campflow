import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  useCreateSinglePoll,
  useCreateMultiPoll,
  useCreateLocationPoll,
} from '../../../shared/api/polls.hooks';
import type { PollType } from '../../../shared/api/polls.api';

interface Props {
  roomId: string;
  onClose: () => void;
}

interface FormValues {
  title: string;
  description?: string;
  allowAssign?: boolean;
  options: { label: string; address?: string; latitude?: string; longitude?: string }[];
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
    hint: 'Точки на мапі — координати',
  },
};

export function CreatePollModal({ roomId, onClose }: Props) {
  const [type, setType] = useState<PollType>('single_choice');
  const createSingle = useCreateSinglePoll();
  const createMulti = useCreateMultiPoll();
  const createLocation = useCreateLocationPoll();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      allowAssign: false,
      options: [{ label: '' }, { label: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'options' });

  const isLoading =
    createSingle.isPending || createMulti.isPending || createLocation.isPending;

  async function onSubmit(values: FormValues) {
    const baseOptions = values.options
      .map((o) => ({ ...o, label: o.label.trim() }))
      .filter((o) => o.label.length > 0);

    if (baseOptions.length < 2) return;

    try {
      if (type === 'single_choice') {
        await createSingle.mutateAsync({
          roomId,
          title: values.title.trim(),
          description: values.description?.trim() || undefined,
          options: baseOptions.map((o) => ({ label: o.label })),
        });
      } else if (type === 'multi_choice') {
        await createMulti.mutateAsync({
          roomId,
          title: values.title.trim(),
          description: values.description?.trim() || undefined,
          allowAssign: values.allowAssign,
          options: baseOptions.map((o) => ({ label: o.label })),
        });
      } else {
        // location: координати обов'язкові
        const locationOptions = baseOptions
          .filter((o) => o.latitude && o.longitude)
          .map((o) => ({
            label: o.label,
            latitude: parseFloat(o.latitude!),
            longitude: parseFloat(o.longitude!),
            address: o.address?.trim() || undefined,
          }));
        if (locationOptions.length < 2) {
          alert('Для локацій потрібні координати (поки вручну, карти підключимо в наступному блоці).');
          return;
        }
        await createLocation.mutateAsync({
          roomId,
          title: values.title.trim(),
          description: values.description?.trim() || undefined,
          options: locationOptions,
        });
      }
      onClose();
    } catch {
      // помилка покаже onError у мутації
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
        <h2 className="font-display text-xl font-bold text-forest-900 mb-4">
          Нове опитування
        </h2>

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
              <div className="text-xs font-semibold text-forest-900">
                {TYPE_LABELS[t].label}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-forest-500 mb-5 italic">{TYPE_LABELS[type].hint}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">Питання</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition"
              placeholder={type === 'single_choice' ? 'Коли їдемо?' : type === 'multi_choice' ? 'Що беремо в дорогу?' : 'Куди заїдемо?'}
              {...register('title', {
                required: 'Введіть питання',
                minLength: { value: 2, message: 'Мінімум 2 символи' },
              })}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
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

          {/* Варіанти */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-forest-700">Варіанти</label>
              <button
                type="button"
                onClick={() =>
                  append(type === 'location' ? { label: '', latitude: '', longitude: '', address: '' } : { label: '' })
                }
                className="text-xs text-forest-600 hover:text-forest-900 font-semibold"
              >
                + Додати варіант
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="bg-forest-50 rounded-xl p-2 space-y-2">
                  <div className="flex gap-2">
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

                  {type === 'location' && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Широта (50.45)"
                        className="px-3 py-1.5 rounded-lg border border-forest-100 focus:border-forest-500 outline-none text-xs font-mono"
                        {...register(`options.${idx}.latitude` as const)}
                      />
                      <input
                        placeholder="Довгота (30.52)"
                        className="px-3 py-1.5 rounded-lg border border-forest-100 focus:border-forest-500 outline-none text-xs font-mono"
                        {...register(`options.${idx}.longitude` as const)}
                      />
                      <input
                        placeholder="Адреса (необов'язково)"
                        className="col-span-2 px-3 py-1.5 rounded-lg border border-forest-100 focus:border-forest-500 outline-none text-xs"
                        {...register(`options.${idx}.address` as const)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {type === 'location' && (
              <p className="text-xs text-forest-500 mt-2 italic">
                💡 Підказка: координати можна взяти з Google Maps (правий клік → координати). Карти підключимо в наступному блоці.
              </p>
            )}
          </div>

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