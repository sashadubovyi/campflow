import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Smile, Calendar, AlignLeft, AtSign, Phone, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../shared/store/useAuth';
import { useUpdateMyProfile } from '../shared/api/profile.hooks';
import { useMyProfile } from '../shared/api/profile.hooks';
import type { Gender, Visibility } from '../shared/api/profile.api';

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────

const HOBBY_TAGS = [
  'Походи', 'Велосипед', 'Біг', 'Подорожі', 'Музика', 'Фото',
  'Малювання', 'Книги', 'Кіно', 'Кулінарія', 'Йога', 'Футбол',
  'Плавання', 'Ігри', 'Кава',
];

const HOBBY_COLORS = [
  '#2d6ff8', '#ec4899', '#7c3aed', '#0891b2',
  '#f59e0b', '#ea580c', '#16a34a', '#4f46e5',
];

const GENDER_OPTIONS: { value: Gender; emoji: string }[] = [
  { value: 'male', emoji: '👨' },
  { value: 'female', emoji: '👩' },
  { value: 'unspecified', emoji: '🙂' },
];

const TOTAL_STEPS = 7;

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface FormState {
  city: string;
  hobbies: string[];
  hobbiesCustom: string;
  birthDate: string;
  gender: Gender | '';
  bio: string;
  instagram: string;
  telegram: string;
  whatsapp: string;
  facebook: string;
  threads: string;
  phone: string;
}

// ──────────────────────────────────────────────
// Slide animation
// ──────────────────────────────────────────────

function SlideStep({
  children,
  direction,
  stepKey,
}: {
  children: React.ReactNode;
  direction: number;
  stepKey: number;
}) {
  return (
    <motion.div
      key={stepKey}
      custom={direction}
      initial={{ opacity: 0, x: direction > 0 ? 48 : -48 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction > 0 ? -48 : 48 }}
      transition={{ type: 'spring', stiffness: 420, damping: 38 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Individual steps
// ──────────────────────────────────────────────

function StepCity({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <StepIcon icon={MapPin} color="#2d6ff8" />
      <h2 className="text-2xl font-bold text-neutral-900 text-center">{t('onboarding.city.title')}</h2>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('onboarding.city.placeholder')}
        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none text-base transition"
      />
    </div>
  );
}

function StepInterests({
  hobbies, onToggle, custom, onCustomChange,
}: {
  hobbies: string[];
  onToggle: (tag: string) => void;
  custom: string;
  onCustomChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <StepIcon icon={Smile} color="#ec4899" />
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">{t('onboarding.interests.title')}</h2>
        <p className="text-sm text-neutral-400 mt-1">{t('onboarding.interests.subtitle')}</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {HOBBY_TAGS.map((tag, i) => {
          const active = hobbies.includes(tag);
          return (
            <motion.button
              key={tag}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onToggle(tag)}
              style={active ? { background: HOBBY_COLORS[i % HOBBY_COLORS.length] } : undefined}
              className={`text-sm font-medium px-3.5 py-1.5 rounded-full transition-colors ${
                active ? 'text-white shadow-sm' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {tag}
            </motion.button>
          );
        })}
      </div>
      <input
        value={custom}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder={t('onboarding.interests.customPlaceholder')}
        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none text-sm transition"
      />
    </div>
  );
}

function StepBirthdate({
  birthDate, onBirthDate, gender, onGender,
}: {
  birthDate: string;
  onBirthDate: (v: string) => void;
  gender: Gender | '';
  onGender: (v: Gender) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <StepIcon icon={Calendar} color="#7c3aed" />
      <h2 className="text-2xl font-bold text-neutral-900 text-center">{t('onboarding.birthdate.title')}</h2>
      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1.5">{t('onboarding.birthdate.birth')}</label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => onBirthDate(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none text-base transition"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-2">{t('onboarding.birthdate.gender')}</label>
        <div className="flex gap-3">
          {GENDER_OPTIONS.map(({ value, emoji }) => (
            <motion.button
              key={value}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onGender(value)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition text-sm font-medium ${
                gender === value
                  ? 'border-accent-500 bg-accent-50 text-accent-700'
                  : 'border-neutral-200 text-neutral-600 hover:border-accent-300'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span>{t(`profile.gender.${value}`)}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepBio({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <StepIcon icon={AlignLeft} color="#0891b2" />
      <h2 className="text-2xl font-bold text-neutral-900 text-center">{t('onboarding.bio.title')}</h2>
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        maxLength={2000}
        placeholder={t('onboarding.bio.placeholder')}
        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none text-sm resize-none transition"
      />
    </div>
  );
}

function StepSocials({
  instagram, telegram, whatsapp, facebook, threads,
  onChange,
}: {
  instagram: string; telegram: string; whatsapp: string; facebook: string; threads: string;
  onChange: (field: 'instagram' | 'telegram' | 'whatsapp' | 'facebook' | 'threads', v: string) => void;
}) {
  const { t } = useTranslation();
  const fields: { field: 'instagram' | 'telegram' | 'whatsapp' | 'facebook' | 'threads'; label: string; placeholder: string; color: string }[] = [
    { field: 'instagram', label: 'Instagram', placeholder: '@username', color: '#e1306c' },
    { field: 'telegram', label: 'Telegram', placeholder: '@username', color: '#229ed9' },
    { field: 'whatsapp', label: 'WhatsApp', placeholder: '+380...', color: '#25d366' },
    { field: 'facebook', label: 'Facebook', placeholder: 'username', color: '#1877f2' },
    { field: 'threads', label: 'Threads', placeholder: '@username', color: '#000000' },
  ];
  const values = { instagram, telegram, whatsapp, facebook, threads };
  return (
    <div className="space-y-4">
      <StepIcon icon={AtSign} color="#f59e0b" />
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">{t('onboarding.socials.title')}</h2>
        <p className="text-sm text-neutral-400 mt-1">{t('onboarding.socials.subtitle')}</p>
      </div>
      <div className="space-y-3">
        {fields.map(({ field, label, placeholder, color }) => (
          <div key={field} className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
              style={{ background: color }}
            >
              {label[0]}
            </span>
            <input
              value={values[field]}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none text-sm transition"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepPhone({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <StepIcon icon={Phone} color="#22c55e" />
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">{t('onboarding.phone.title')}</h2>
        <p className="text-sm text-neutral-400 mt-1">{t('onboarding.phone.subtitle')}</p>
      </div>
      <input
        type="tel"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('onboarding.phone.placeholder')}
        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none text-base transition"
      />
    </div>
  );
}

function StepPrivacy() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <StepIcon icon={ShieldCheck} color="#2d6ff8" />
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">{t('onboarding.privacy.title')}</h2>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{t('onboarding.privacy.subtitle')}</p>
      </div>
      <div className="bg-accent-50 rounded-2xl p-4 space-y-2">
        {['Email', 'Телефон', 'Telegram', 'WhatsApp', 'Instagram', 'Facebook', 'Threads'].map((item) => (
          <div key={item} className="flex items-center justify-between text-sm">
            <span className="text-neutral-700 font-medium">{item}</span>
            <span className="text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-lg text-xs">Приховано</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepIcon({ icon: Icon, color }: { icon: React.ElementType; color: string }) {
  return (
    <div className="flex justify-center mb-2">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}15` }}
      >
        <Icon size={28} style={{ color }} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: existingProfile } = useMyProfile();
  const update = useUpdateMyProfile();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>({
    city: '',
    hobbies: [],
    hobbiesCustom: '',
    birthDate: '',
    gender: '',
    bio: '',
    instagram: '',
    telegram: '',
    whatsapp: '',
    facebook: '',
    threads: '',
    phone: '',
  });

  // Pre-fill with existing data (from OAuth profile or registration phone)
  const [prefilled, setPrefilled] = useState(false);
  if (existingProfile && !prefilled) {
    setPrefilled(true);
    setForm((prev) => ({
      ...prev,
      city: existingProfile.city ?? '',
      hobbies: existingProfile.hobbies ?? [],
      hobbiesCustom: existingProfile.hobbiesCustom ?? '',
      birthDate: existingProfile.birthDate ? existingProfile.birthDate.slice(0, 10) : '',
      gender: existingProfile.gender ?? '',
      bio: existingProfile.bio ?? '',
      instagram: existingProfile.instagram ?? '',
      telegram: existingProfile.telegram ?? '',
      whatsapp: existingProfile.whatsapp ?? '',
      facebook: existingProfile.facebook ?? '',
      threads: existingProfile.threads ?? '',
      phone: existingProfile.phone ?? '',
    }));
  }

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleHobby(tag: string) {
    const current = form.hobbies;
    set('hobbies', current.includes(tag) ? current.filter((h) => h !== tag) : [...current, tag]);
  }

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  async function handleFinish() {
    const visibility: Visibility = 'hidden';
    await update.mutateAsync({
      city: form.city || null,
      hobbies: form.hobbies,
      hobbiesCustom: form.hobbiesCustom || null,
      birthDate: form.birthDate || null,
      gender: (form.gender as Gender) || null,
      bio: form.bio || null,
      instagram: form.instagram || null,
      telegram: form.telegram || null,
      whatsapp: form.whatsapp || null,
      facebook: form.facebook || null,
      threads: form.threads || null,
      phone: form.phone || null,
      emailVisibility: visibility,
      phoneVisibility: visibility,
      telegramVisibility: visibility,
      whatsappVisibility: visibility,
      instagramVisibility: visibility,
      facebookVisibility: visibility,
      threadsVisibility: visibility,
    });
    if (user) {
      localStorage.setItem(`au_onboarded_${user.id}`, '1');
    }
    navigate('/rooms');
  }

  const isLast = step === TOTAL_STEPS - 1;

  const steps = [
    <StepCity key={0} value={form.city} onChange={(v) => set('city', v)} />,
    <StepInterests key={1} hobbies={form.hobbies} onToggle={toggleHobby} custom={form.hobbiesCustom} onCustomChange={(v) => set('hobbiesCustom', v)} />,
    <StepBirthdate key={2} birthDate={form.birthDate} onBirthDate={(v) => set('birthDate', v)} gender={form.gender} onGender={(v) => set('gender', v)} />,
    <StepBio key={3} value={form.bio} onChange={(v) => set('bio', v)} />,
    <StepSocials
      key={4}
      instagram={form.instagram} telegram={form.telegram} whatsapp={form.whatsapp} facebook={form.facebook} threads={form.threads}
      onChange={(field, v) => set(field, v)}
    />,
    <StepPhone key={5} value={form.phone} onChange={(v) => set('phone', v)} />,
    <StepPrivacy key={6} />,
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-between px-6 py-8 font-body">
      {/* Progress dots */}
      <div className="flex gap-1.5 mb-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <motion.span
            key={i}
            animate={{ width: i === step ? 24 : 8, background: i <= step ? '#2d6ff8' : '#e2e5ec' }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="h-2 rounded-full"
          />
        ))}
      </div>
      <p className="text-xs text-neutral-400 mb-6">{t('onboarding.step', { current: step + 1, total: TOTAL_STEPS })}</p>

      {/* Step content */}
      <div className="w-full max-w-sm flex-1 flex items-center">
        <div className="w-full overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <SlideStep direction={direction} stepKey={step}>
              {steps[step]}
            </SlideStep>
          </AnimatePresence>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm mt-8 space-y-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          onClick={isLast ? handleFinish : () => go(step + 1)}
          disabled={update.isPending}
          className="w-full h-12 bg-brand-gradient hover:bg-brand-gradient-hover disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition"
        >
          {update.isPending ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {isLast ? t('onboarding.finish') : t('onboarding.next')}
              {!isLast && <ChevronRight size={18} />}
            </>
          )}
        </motion.button>

        {step > 0 && (
          <button
            onClick={() => go(step - 1)}
            className="w-full text-center text-sm text-neutral-400 hover:text-neutral-600 py-2 transition"
          >
            ← {t('common.back')}
          </button>
        )}

        <button
          onClick={isLast ? handleFinish : () => go(step + 1)}
          className="w-full text-center text-sm text-neutral-400 hover:text-neutral-600 py-1 transition"
        >
          {t('onboarding.skip')}
        </button>
      </div>
    </div>
  );
}
