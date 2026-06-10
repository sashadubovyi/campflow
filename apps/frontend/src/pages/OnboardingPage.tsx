import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MapPin, Smile, Calendar, AlignLeft, Phone, ShieldCheck, ChevronRight,
  User, Camera, Check, X, Loader2, Upload, AtSign, Send, MessageCircle,
  Mars, Venus, VenusAndMars,
} from 'lucide-react';
import { useAuth } from '../shared/store/useAuth';
import { useAuthStore } from '../shared/store/auth.store';
import { useUpdateMyProfile, useMyProfile } from '../shared/api/profile.hooks';
import { profileApi } from '../shared/api/profile.api';
import type { Gender, Visibility } from '../shared/api/profile.api';

// ── Config ──

const HOBBY_TAGS = [
  'Походи', 'Велосипед', 'Біг', 'Подорожі', 'Музика', 'Фото',
  'Малювання', 'Книги', 'Кіно', 'Кулінарія', 'Йога', 'Футбол',
  'Плавання', 'Ігри', 'Кава',
];

const HOBBY_COLORS = [
  '#2d6ff8', '#ec4899', '#7c3aed', '#0891b2',
  '#f59e0b', '#ea580c', '#16a34a', '#4f46e5',
];

const GENDER_OPTIONS: { value: Gender; labelKey: string; Icon: React.ElementType }[] = [
  { value: 'male',        labelKey: 'profile.gender.male',        Icon: Mars },
  { value: 'female',      labelKey: 'profile.gender.female',      Icon: Venus },
  { value: 'unspecified', labelKey: 'profile.gender.unspecified', Icon: VenusAndMars },
];

const TOTAL_STEPS = 9;

// ── Types ──

interface FormState {
  firstName: string;
  lastName: string;
  username: string;
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

type SocialField = 'instagram' | 'telegram' | 'whatsapp' | 'facebook' | 'threads';
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

// ── Brand icons (inline SVG, lucide-compatible style) ──

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden focusable="false"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="currentColor" aria-hidden focusable="false"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const SOCIAL_FIELDS: {
  field: SocialField; label: string; placeholder: string; color: string;
  Icon: React.ElementType;
}[] = [
  { field: 'instagram', label: 'Instagram', placeholder: '@username', color: '#e1306c', Icon: InstagramIcon },
  { field: 'telegram',  label: 'Telegram',  placeholder: '@username', color: '#229ed9', Icon: Send },
  { field: 'whatsapp',  label: 'WhatsApp',  placeholder: '+380...',   color: '#25d366', Icon: MessageCircle },
  { field: 'facebook',  label: 'Facebook',  placeholder: 'username',  color: '#1877f2', Icon: FacebookIcon },
  { field: 'threads',   label: 'Threads',   placeholder: '@username', color: '#000000', Icon: AtSign },
];

// ── Shared primitives ──

function SlideStep({
  children, direction, stepKey,
}: {
  children: React.ReactNode; direction: number; stepKey: number;
}) {
  return (
    <motion.div
      key={stepKey}
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

// ── Step 0: Identity ──

function StepIdentity({
  firstName, onFirstName, lastName, onLastName,
  username, onUsername, usernameStatus,
}: {
  firstName: string; onFirstName: (v: string) => void;
  lastName: string; onLastName: (v: string) => void;
  username: string; onUsername: (v: string) => void;
  usernameStatus: UsernameStatus;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <StepIcon icon={User} color="#2d6ff8" />
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">{t('onboarding.identity.title')}</h2>
        <p className="text-sm text-neutral-400 mt-1">{t('onboarding.identity.subtitle')}</p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1.5">
            {t('onboarding.identity.firstName')}
          </label>
          <input
            value={firstName}
            onChange={(e) => onFirstName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none text-base transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1.5">
            {t('onboarding.identity.lastName')}
          </label>
          <input
            value={lastName}
            onChange={(e) => onLastName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none text-base transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1.5">
            {t('onboarding.identity.username')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 select-none">
              @
            </span>
            <input
              value={username}
              onChange={(e) =>
                onUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
              }
              placeholder={t('onboarding.identity.usernamePlaceholder')}
              className="w-full pl-8 pr-10 py-3 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none text-base transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && (
                <Loader2 size={16} className="animate-spin text-neutral-400" />
              )}
              {usernameStatus === 'available' && <Check size={16} className="text-green-500" />}
              {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                <X size={16} className="text-red-400" />
              )}
            </span>
          </div>
          {usernameStatus === 'taken' && (
            <p className="text-red-500 text-xs mt-1">{t('onboarding.identity.usernameTaken')}</p>
          )}
          {usernameStatus === 'invalid' && (
            <p className="text-neutral-400 text-xs mt-1">{t('onboarding.identity.usernameInvalid')}</p>
          )}
          {usernameStatus === 'available' && (
            <p className="text-green-600 text-xs mt-1">{t('onboarding.identity.usernameAvailable')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Avatar ──

function StepAvatar({
  avatarPreview, existingAvatarUrl, onFileSelect,
}: {
  avatarPreview: string | null;
  existingAvatarUrl: string | null;
  onFileSelect: (file: File) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const displayUrl = avatarPreview ?? existingAvatarUrl;

  return (
    <div className="space-y-4">
      <StepIcon icon={Camera} color="#7c3aed" />
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">{t('onboarding.avatar.title')}</h2>
        <p className="text-sm text-neutral-400 mt-1">{t('onboarding.avatar.subtitle')}</p>
      </div>
      <div className="flex flex-col items-center gap-4 pt-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => inputRef.current?.click()}
          className="relative w-28 h-28 rounded-full overflow-hidden bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center group"
        >
          {displayUrl ? (
            <>
              <img src={displayUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload size={22} className="text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-neutral-400 pointer-events-none">
              <Camera size={32} />
              <span className="text-xs font-medium">{t('onboarding.avatar.upload')}</span>
            </div>
          )}
        </motion.button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-accent-600 font-semibold text-sm hover:text-accent-700 transition"
        >
          {displayUrl ? t('onboarding.avatar.change') : t('onboarding.avatar.upload')}
        </button>
      </div>
    </div>
  );
}

// ── Step 2: City ──

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

// ── Step 3: Interests ──

function StepInterests({
  hobbies, onToggle, custom, onCustomChange,
}: {
  hobbies: string[]; onToggle: (tag: string) => void;
  custom: string; onCustomChange: (v: string) => void;
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
              key={tag} type="button" whileTap={{ scale: 0.94 }}
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

// ── Step 4: Birthdate + Gender ──

function StepBirthdate({
  birthDate, onBirthDate, gender, onGender,
}: {
  birthDate: string; onBirthDate: (v: string) => void;
  gender: Gender | ''; onGender: (v: Gender) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <StepIcon icon={Calendar} color="#7c3aed" />
      <h2 className="text-2xl font-bold text-neutral-900 text-center">{t('onboarding.birthdate.title')}</h2>
      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1.5">
          {t('onboarding.birthdate.birth')}
        </label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => onBirthDate(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none text-base transition"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-2">
          {t('onboarding.birthdate.gender')}
        </label>
        <div className="flex gap-3">
          {GENDER_OPTIONS.map(({ value, labelKey, Icon }) => (
            <motion.button
              key={value} type="button" whileTap={{ scale: 0.94 }}
              onClick={() => onGender(value)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition text-sm font-medium ${
                gender === value
                  ? 'border-accent-500 bg-accent-50 text-accent-700'
                  : 'border-neutral-200 text-neutral-600 hover:border-accent-300'
              }`}
            >
              <Icon size={20} />
              <span>{t(labelKey)}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 5: Bio ──

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

// ── Step 6: Socials ──

function StepSocials({
  instagram, telegram, whatsapp, facebook, threads, onChange,
}: {
  instagram: string; telegram: string; whatsapp: string; facebook: string; threads: string;
  onChange: (field: SocialField, v: string) => void;
}) {
  const { t } = useTranslation();
  const values: Record<SocialField, string> = { instagram, telegram, whatsapp, facebook, threads };
  return (
    <div className="space-y-4">
      <StepIcon icon={AtSign} color="#f59e0b" />
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">{t('onboarding.socials.title')}</h2>
        <p className="text-sm text-neutral-400 mt-1">{t('onboarding.socials.subtitle')}</p>
      </div>
      <div className="space-y-3">
        {SOCIAL_FIELDS.map(({ field, label, placeholder, color, Icon }) => (
          <div key={field} className="flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
              style={{ background: color }}
            >
              <Icon size={18} />
            </span>
            <input
              value={values[field]}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder={placeholder}
              aria-label={label}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none text-sm transition"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 7: Phone ──

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

// ── Step 8: Privacy ──

function StepPrivacy() {
  const { t } = useTranslation();
  const hiddenLabel = t('profile.visibility.hidden');
  const items = [
    'Email',
    t('auth.phone'),
    'Telegram',
    'WhatsApp',
    'Instagram',
    'Facebook',
    'Threads',
  ];
  return (
    <div className="space-y-4">
      <StepIcon icon={ShieldCheck} color="#2d6ff8" />
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">{t('onboarding.privacy.title')}</h2>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{t('onboarding.privacy.subtitle')}</p>
      </div>
      <div className="bg-accent-50 rounded-2xl p-4 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center justify-between text-sm">
            <span className="text-neutral-700 font-medium">{item}</span>
            <span className="text-neutral-400 bg-white px-2.5 py-0.5 rounded-lg text-xs border border-neutral-100">
              {hiddenLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ──

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: existingProfile } = useMyProfile();
  const update = useUpdateMyProfile();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [finishError, setFinishError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    firstName: '', lastName: '', username: '',
    city: '', hobbies: [], hobbiesCustom: '',
    birthDate: '', gender: '', bio: '',
    instagram: '', telegram: '', whatsapp: '', facebook: '', threads: '', phone: '',
  });

  // Avatar state
  const objectUrlRef = useRef<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Username availability
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill from existing profile (OAuth / previous registration)
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (existingProfile && !prefilled) {
      setPrefilled(true);
      const parts = (existingProfile.fullName ?? '').trim().split(/\s+/);
      setForm((prev) => ({
        ...prev,
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' '),
        username: existingProfile.username ?? '',
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
  }, [existingProfile, prefilled]);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function handleAvatarSelect(file: File) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setAvatarFile(file);
    setAvatarPreview(url);
  }

  function handleUsernameChange(value: string) {
    setFormField('username', value);
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    if (!value) { setUsernameStatus('idle'); return; }
    if (value.length < 3 || value.length > 20) { setUsernameStatus('invalid'); return; }
    // Current username is trivially available
    if (value === existingProfile?.username) { setUsernameStatus('available'); return; }
    setUsernameStatus('checking');
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const { available } = await profileApi.checkUsername(value);
        setUsernameStatus(available ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
  }

  function setFormField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleHobby(tag: string) {
    const cur = form.hobbies;
    setFormField('hobbies', cur.includes(tag) ? cur.filter((h) => h !== tag) : [...cur, tag]);
  }

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  async function handleFinish() {
    setFinishError(null);
    try {
      if (avatarFile) {
        const { avatarUrl } = await profileApi.uploadAvatar(avatarFile);
        const cur = useAuthStore.getState().user;
        if (cur) useAuthStore.getState().setUser({ ...cur, avatarUrl });
      }
      const fullName = [form.firstName, form.lastName].filter(Boolean).join(' ');
      const visibility: Visibility = 'hidden';
      await update.mutateAsync({
        fullName: fullName || undefined,
        username: form.username || undefined,
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
      if (user) localStorage.setItem(`au_onboarded_${user.id}`, '1');
      navigate('/rooms');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setFinishError(Array.isArray(msg) ? msg[0]! : (msg ?? t('common.error')));
    }
  }

  const isLast = step === TOTAL_STEPS - 1;
  const isBusy = update.isPending;

  const steps: React.ReactNode[] = [
    <StepIdentity
      key={0}
      firstName={form.firstName} onFirstName={(v) => setFormField('firstName', v)}
      lastName={form.lastName} onLastName={(v) => setFormField('lastName', v)}
      username={form.username} onUsername={handleUsernameChange}
      usernameStatus={usernameStatus}
    />,
    <StepAvatar
      key={1}
      avatarPreview={avatarPreview}
      existingAvatarUrl={existingProfile?.avatarUrl ?? null}
      onFileSelect={handleAvatarSelect}
    />,
    <StepCity key={2} value={form.city} onChange={(v) => setFormField('city', v)} />,
    <StepInterests
      key={3}
      hobbies={form.hobbies} onToggle={toggleHobby}
      custom={form.hobbiesCustom} onCustomChange={(v) => setFormField('hobbiesCustom', v)}
    />,
    <StepBirthdate
      key={4}
      birthDate={form.birthDate} onBirthDate={(v) => setFormField('birthDate', v)}
      gender={form.gender} onGender={(v) => setFormField('gender', v)}
    />,
    <StepBio key={5} value={form.bio} onChange={(v) => setFormField('bio', v)} />,
    <StepSocials
      key={6}
      instagram={form.instagram} telegram={form.telegram}
      whatsapp={form.whatsapp} facebook={form.facebook} threads={form.threads}
      onChange={(field, v) => setFormField(field, v)}
    />,
    <StepPhone key={7} value={form.phone} onChange={(v) => setFormField('phone', v)} />,
    <StepPrivacy key={8} />,
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-between px-6 py-8 font-body">
      {/* Progress dots */}
      <div className="w-full max-w-sm flex flex-col items-center gap-1">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <motion.span
              key={i}
              animate={{
                width: i === step ? 24 : 8,
                background: i <= step ? '#2d6ff8' : '#e2e5ec',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="h-2 rounded-full inline-block"
            />
          ))}
        </div>
        <p className="text-xs text-neutral-400">
          {t('onboarding.step', { current: step + 1, total: TOTAL_STEPS })}
        </p>
      </div>

      {/* Step content */}
      <div className="w-full max-w-sm flex-1 flex items-center py-6">
        <div className="w-full overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <SlideStep direction={direction} stepKey={step}>
              {steps[step]}
            </SlideStep>
          </AnimatePresence>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        {finishError && (
          <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2 text-center">
            {finishError}
          </p>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          onClick={isLast ? handleFinish : () => go(step + 1)}
          disabled={isBusy || usernameStatus === 'taken'}
          className="w-full h-12 btn-glass-blue disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition"
        >
          {isBusy ? (
            <Loader2 size={20} className="animate-spin" />
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
            {t('common.back')}
          </button>
        )}

        <button
          onClick={isLast ? handleFinish : () => go(step + 1)}
          disabled={isBusy}
          className="w-full text-center text-sm text-neutral-400 hover:text-neutral-600 py-1 transition"
        >
          {t('onboarding.skip')}
        </button>
      </div>
    </div>
  );
}
