import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  useCreateSinglePoll,
  useCreateMultiPoll,
  useCreateLocationPoll,
} from '../../../shared/api/polls.hooks';
import { useGenerateChecklist, useCheckDuplicate } from '../../../shared/api/ai.hooks';
import type { PollType } from '../../../shared/api/polls.api';
import { MapPicker, type PickedLocation } from '../../../shared/ui/map/MapPicker';
import { Sparkles, CircleDot, ListChecks, MapPin } from 'lucide-react';
import { cn } from '../../../shared/ui';

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

export function CreatePollModal({ roomId, onClose }: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState<PollType>('single_choice');
  const [locationDrafts, setLocationDrafts] = useState<LocationDraft[]>([]);
  const [pendingPick, setPendingPick] = useState<PickedLocation | null>(null);
  const [pendingLabel, setPendingLabel] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiSource, setAiSource] = useState<'ai' | 'fallback' | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    isDuplicate: boolean;
    similarTo: string | null;
  } | null>(null);

  const createSingle = useCreateSinglePoll();
  const createMulti = useCreateMultiPoll();
  const createLocation = useCreateLocationPoll();
  const generateChecklist = useGenerateChecklist();
  const checkDuplicate = useCheckDuplicate();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BaseFormValues>({
    defaultValues: {
      title: '',
      description: '',
      allowAssign: false,
      options: [{ label: '' }, { label: '' }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'options' });
  const titleValue = watch('title');

  // Дебаунс перевірки дублікатів через AI
  useEffect(() => {
    // Не перевіряємо якщо заголовок занадто короткий або це location-опитування
    if (!titleValue || titleValue.trim().length < 5 || type === 'location') {
      setDuplicateWarning(null);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        const result = await checkDuplicate.mutateAsync({
          roomId,
          title: titleValue.trim(),
        });
        if (result.isDuplicate) {
          setDuplicateWarning({
            isDuplicate: true,
            similarTo: result.similarTo,
          });
        } else {
          setDuplicateWarning(null);
        }
      } catch {
        setDuplicateWarning(null);
      }
    }, 2000); // 2 секунди після останнього натискання клавіші

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleValue, type, roomId]);

  const isLoading = createSingle.isPending || createMulti.isPending || createLocation.isPending;

  function getTypeLabel(pt: PollType): string {
    if (pt === 'single_choice') return 'singleChoice';
    if (pt === 'multi_choice') return 'multiChoice';
    return 'location';
  }

  async function handleAiGenerate() {
    const wordCount = aiDescription.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 5) {
      alert(t('polls.ai.tooShort'));
      return;
    }
    try {
      const result = await generateChecklist.mutateAsync(aiDescription.trim());
      replace(result.items.map((item) => ({ label: item.label })));
      setAiSource(result.source);
      setShowAiInput(false);
      setValue('title', aiDescription.trim().slice(0, 80));
    } catch {
      alert(t('polls.ai.errorBody'));
    }
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

  const TYPE_ICON: Record<PollType, typeof CircleDot> = {
    single_choice: CircleDot,
    multi_choice: ListChecks,
    location: MapPin,
  };

  return (
    <div
      className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 font-body max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-neutral-900 mb-4">
          {t('polls.newPoll')}
        </h2>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {pollTypes.map((pt) => {
            const Icon = TYPE_ICON[pt];
            const active = type === pt;
            return (
              <button
                key={pt}
                type="button"
                onClick={() => {
                  setType(pt);
                  setAiSource(null);
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition',
                  active
                    ? 'border-transparent bg-brand-gradient text-white shadow-card'
                    : 'border-neutral-200 text-neutral-500 hover:border-accent-500/40 hover:text-neutral-700',
                )}
              >
                <Icon size={20} />
                <span className="text-xs font-semibold">
                  {t(`polls.types.${getTypeLabel(pt)}`)}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-neutral-400 mb-5 italic">
          {t(`polls.types.${getTypeLabel(type)}Hint`)}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              {t('polls.question')}
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-100 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition"
              {...register('title', {
                required: true,
                minLength: { value: 2, message: '' },
              })}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{t('polls.question')}</p>}
            {duplicateWarning && duplicateWarning.isDuplicate && (
              <div className="mt-2 bg-accent-500/10 border border-accent-500/30 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-accent-600">
                  {t('polls.ai.duplicateWarning')}
                </p>
                {duplicateWarning.similarTo && (
                  <p className="text-xs text-neutral-700 mt-0.5">
                    {t('polls.ai.duplicateBody', { title: duplicateWarning.similarTo })}
                  </p>
                )}
              </div>
            )}
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
                    className="w-4 h-4 accent-accent-500"
                  />
                )}
              />
              <span className="text-sm text-neutral-700">{t('polls.allowAssign')}</span>
            </label>
          )}

          {/* AI блок для multi_choice */}
          {type === 'multi_choice' && !showAiInput && (
            <button
              type="button"
              onClick={() => setShowAiInput(true)}
              className="ai-border w-full rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-neutral-900 bg-gradient-to-br from-white/70 to-accent-50/50 backdrop-blur-md hover:from-white/90 transition"
            >
              <Sparkles size={16} className="text-[#655adc]" />
              {t('polls.ai.assist')}
            </button>
          )}

          {type === 'multi_choice' && showAiInput && (
            <div className="bg-gradient-to-br from-accent-500/5 to-accent-400/5 border border-accent-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <label className="text-sm font-semibold text-neutral-900">
                  {t('polls.ai.describePrompt')}
                </label>
                <button
                  type="button"
                  onClick={() => setShowAiInput(false)}
                  className="text-neutral-400 hover:text-neutral-700 text-xs"
                >
                  ✕
                </button>
              </div>
              <textarea
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                rows={2}
                placeholder={t('polls.ai.describePlaceholder')}
                className="w-full px-3 py-2 rounded-lg border border-neutral-100 focus:border-accent-500 outline-none text-sm resize-none"
              />
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={generateChecklist.isPending || aiDescription.trim().length < 5}
                className="w-full bg-brand-gradient hover:bg-brand-gradient-hover disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition"
              >
                {generateChecklist.isPending ? t('polls.ai.generating') : t('polls.ai.generate')}
              </button>
            </div>
          )}

          {aiSource && (
            <div
              className={`text-xs font-medium px-3 py-1.5 rounded-lg inline-block ${
                aiSource === 'ai'
                  ? 'bg-accent-500/10 text-accent-600'
                  : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              {aiSource === 'ai' ? t('polls.ai.fromAi') : t('polls.ai.fromFallback')}
            </div>
          )}

          {type !== 'location' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-neutral-700">{t('polls.options')}</label>
                <button
                  type="button"
                  onClick={() => append({ label: '' })}
                  className="text-xs text-accent-600 hover:text-neutral-900 font-semibold"
                >
                  {t('polls.addOption')}
                </button>
              </div>
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      placeholder={`${idx + 1}`}
                      className="flex-1 px-3 py-2 rounded-lg border border-neutral-100 focus:border-accent-500 outline-none text-sm"
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
              <label className="text-sm font-medium text-neutral-700">{t('polls.mapHint')}</label>
              <MapPicker onPick={handleMapPick} />

              {pendingPick && (
                <div className="bg-neutral-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs text-neutral-700">
                    {t('polls.pointSelected')}: {pendingPick.latitude.toFixed(4)},{' '}
                    {pendingPick.longitude.toFixed(4)}
                  </p>
                  {pendingPick.address && (
                    <p className="text-[10px] text-neutral-400 truncate">{pendingPick.address}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={pendingLabel}
                      onChange={(e) => setPendingLabel(e.target.value)}
                      placeholder={t('polls.pointName')}
                      className="flex-1 px-3 py-2 rounded-lg border border-neutral-100 focus:border-accent-500 outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={confirmLocationDraft}
                      className="bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold px-4 rounded-lg text-sm transition"
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
                      className="flex items-center justify-between gap-2 bg-white border border-neutral-100 rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-neutral-900 truncate">{d.label}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">
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
                <p className="text-xs text-neutral-400 italic">{t('polls.addMinPoints')}</p>
              )}
            </div>
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
              disabled={isLoading}
              className="flex-1 bg-brand-gradient hover:bg-brand-gradient-hover disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
            >
              {isLoading ? t('common.creating') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
