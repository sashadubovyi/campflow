import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMyProfile, useUpdateMyProfile, useUploadAvatar } from '../shared/api/profile.hooks';
import type { Visibility, Gender, MyProfile } from '../shared/api/profile.api';
import { Mail, Phone, Send, MessageCircle, Camera, Users, type LucideIcon } from 'lucide-react';
import { BackButton } from '../shared/ui';

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return (p.length >= 2 ? p[0]![0]! + p[1]![0]! : name.slice(0, 2)).toUpperCase();
}

function AvatarUpload({ avatarUrl, fullName }: { avatarUrl: string | null; fullName: string }) {
  const uploadAvatar = useUploadAvatar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    uploadAvatar.mutate(file, {
      onSuccess: (data) => console.log('[avatar upload]', data),
      onError: () => setPreview(null),
    });
  }

  const src = preview ?? avatarUrl;

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative group rounded-full shrink-0"
        style={{ width: 88, height: 88 }}
        title="Змінити фото"
      >
        {/* Ring */}
        <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#2d6ff8,#8eb5ff,#22c55e,#2d6ff8)] animate-[spin_4s_linear_infinite]" />
        {/* Avatar */}
        <span className="absolute inset-[3px] rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center text-2xl font-semibold text-neutral-600">
          {src ? (
            <img src={src} alt="" className="w-full h-full object-cover" />
          ) : (
            initials(fullName)
          )}
        </span>
        {/* Desktop overlay on hover */}
        <span className="absolute inset-[3px] rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden">
          <Camera size={22} className="text-white" />
        </span>
        {/* Mobile — always visible camera dot */}
        <span className="absolute bottom-0 right-0 w-7 h-7 bg-accent-500 rounded-full border-2 border-white flex items-center justify-center md:hidden">
          <Camera size={14} className="text-white" />
        </span>
        {/* Loading */}
        {uploadAvatar.isPending && (
          <span className="absolute inset-[3px] rounded-full bg-black/50 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      <p className="text-xs text-neutral-400">
        {uploadAvatar.isPending ? 'Завантаження…' : 'Натисніть на фото щоб змінити'}
      </p>
    </div>
  );
}

const HOBBY_GRADIENTS = [
  'linear-gradient(135deg,#598dff,#2d6ff8)', // синій
  'linear-gradient(135deg,#f472b6,#ec4899)', // рожевий
  'linear-gradient(135deg,#a78bfa,#7c3aed)', // фіолетовий
  'linear-gradient(135deg,#22d3ee,#0891b2)', // бірюзовий
  'linear-gradient(135deg,#fde047,#f59e0b)', // жовтий
  'linear-gradient(135deg,#fb923c,#ea580c)', // помаранчевий
  'linear-gradient(135deg,#4ade80,#16a34a)', // зелений
  'linear-gradient(135deg,#818cf8,#4f46e5)', // індиго
];

const HOBBY_TAGS = [
  'Походи',
  'Велосипед',
  'Біг',
  'Подорожі',
  'Музика',
  'Фото',
  'Малювання',
  'Книги',
  'Кіно',
  'Кулінарія',
  'Йога',
  'Футбол',
  'Плавання',
  'Ігри',
  'Кава',
];

const GENDER_VALUES: Gender[] = ['male', 'female', 'unspecified'];

export function ProfileSettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useMyProfile();
  const update = useUpdateMyProfile();
  const [form, setForm] = useState<Partial<MyProfile>>({});
  const [saved, setSaved] = useState(false);
  const isDirty = profile ? JSON.stringify(form) !== JSON.stringify(profile) : false;

  useEffect(() => {
    if (profile && !form.id) setForm(profile);
  }, [profile, form.id]);

  if (isLoading || !profile) {
    return (
      <div className="h-full bg-neutral-50 flex items-center justify-center">
        <p className="font-display text-xl text-neutral-900 animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  function set<K extends keyof MyProfile>(field: K, value: MyProfile[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function toggleHobby(tag: string) {
    const current = form.hobbies ?? [];
    if (current.includes(tag)) {
      set(
        'hobbies',
        current.filter((h) => h !== tag),
      );
    } else {
      set('hobbies', [...current, tag]);
    }
  }

  async function handleSave() {
    const updated = await update.mutateAsync({
      fullName: form.fullName,
      phone: form.phone,
      bio: form.bio,
      city: form.city,
      birthDate: form.birthDate,
      gender: form.gender,
      hobbies: form.hobbies,
      hobbiesCustom: form.hobbiesCustom,
      telegram: form.telegram,
      whatsapp: form.whatsapp,
      instagram: form.instagram,
      facebook: form.facebook,
      emailVisibility: form.emailVisibility,
      phoneVisibility: form.phoneVisibility,
      telegramVisibility: form.telegramVisibility,
      whatsappVisibility: form.whatsappVisibility,
      instagramVisibility: form.instagramVisibility,
      facebookVisibility: form.facebookVisibility,
      inviteFrom: form.inviteFrom,
    });
    setForm(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const birthDateInput = form.birthDate ? form.birthDate.slice(0, 10) : '';

  return (
    <div className="h-full overflow-y-auto bg-neutral-50 font-body pb-20">
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <BackButton />
          <span className="font-display text-lg font-bold text-neutral-900">
            {t('profile.settings')}
          </span>
          {saved ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600 px-4 py-1.5 rounded-xl bg-green-50 animate-fade-in">
              {t('common.saved')}
            </span>
          ) : (
            <button
              onClick={handleSave}
              disabled={!isDirty || update.isPending}
              className={`text-sm font-semibold px-4 py-1.5 rounded-xl transition ${
                isDirty && !update.isPending
                  ? 'bg-brand-gradient text-white'
                  : 'bg-neutral-100 text-neutral-400 cursor-default'
              }`}
            >
              {update.isPending ? t('common.saving') : t('common.save')}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-4">
        <AvatarUpload avatarUrl={profile.avatarUrl} fullName={profile.fullName ?? ''} />
        <Section title={t('profile.sections.basic')}>
          <Field label={t('profile.fields.name')}>
            <input
              value={form.fullName ?? ''}
              onChange={(e) => set('fullName', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={t('profile.fields.username')} hint={t('profile.fields.usernameHint')}>
            <input
              value={profile.username}
              disabled
              className={`${inputCls} bg-neutral-50 text-neutral-400`}
            />
          </Field>
          <Field label={t('profile.fields.city')}>
            <input
              value={form.city ?? ''}
              onChange={(e) => set('city', e.target.value || null)}
              className={inputCls}
              placeholder="Київ"
            />
          </Field>
          <Field label={t('profile.fields.birthDate')}>
            <input
              type="date"
              value={birthDateInput}
              onChange={(e) => set('birthDate', e.target.value || null)}
              className={inputCls}
            />
          </Field>
          <Field label={t('profile.fields.gender')}>
            <div className="flex gap-2">
              {GENDER_VALUES.map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => set('gender', gender)}
                  className={`flex-1 px-3 py-2 rounded-xl border-2 text-sm transition ${
                    form.gender === gender
                      ? 'border-accent-500 bg-neutral-50 text-neutral-900'
                      : 'border-neutral-100 text-neutral-700 hover:border-accent-500/50'
                  }`}
                >
                  {t(`profile.gender.${gender}`)}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        <Section title={t('profile.sections.about')}>
          <Field label={t('profile.fields.bio')}>
            <textarea
              value={form.bio ?? ''}
              onChange={(e) => set('bio', e.target.value || null)}
              rows={4}
              maxLength={2000}
              className={`${inputCls} resize-none`}
              placeholder={t('profile.fields.bioPlaceholder')}
            />
          </Field>
        </Section>

        <Section title={t('profile.sections.hobbies')}>
          <p className="text-xs text-neutral-400 mb-3">{t('profile.fields.hobbiesHint')}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {HOBBY_TAGS.map((tag, index) => {
              const active = form.hobbies?.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleHobby(tag)}
                  style={
                    active
                      ? { background: HOBBY_GRADIENTS[index % HOBBY_GRADIENTS.length] }
                      : undefined
                  }
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
                    active
                      ? 'text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <Field label={t('profile.fields.hobbiesCustom')}>
            <input
              value={form.hobbiesCustom ?? ''}
              onChange={(e) => set('hobbiesCustom', e.target.value || null)}
              className={inputCls}
              placeholder={t('profile.fields.hobbiesCustomPlaceholder')}
              maxLength={200}
            />
          </Field>
        </Section>

        <Section title={t('profile.sections.contacts')}>
          <p className="text-xs text-neutral-400 mb-3">{t('profile.visibility.title')}</p>

          <ContactRow
            label="Email"
            icon={Mail}
            value={profile.email}
            disabled
            visibility={form.emailVisibility}
            onVisibilityChange={(v) => set('emailVisibility', v)}
          />
          <ContactRow
            label={t('auth.phone')}
            icon={Phone}
            value={form.phone ?? ''}
            onChange={(v) => set('phone', v || null)}
            visibility={form.phoneVisibility}
            onVisibilityChange={(v) => set('phoneVisibility', v)}
          />
          <ContactRow
            label="Telegram"
            icon={Send}
            value={form.telegram ?? ''}
            onChange={(v) => set('telegram', v || null)}
            placeholder="@username"
            visibility={form.telegramVisibility}
            onVisibilityChange={(v) => set('telegramVisibility', v)}
          />
          <ContactRow
            label="WhatsApp"
            icon={MessageCircle}
            value={form.whatsapp ?? ''}
            onChange={(v) => set('whatsapp', v || null)}
            placeholder="+380..."
            visibility={form.whatsappVisibility}
            onVisibilityChange={(v) => set('whatsappVisibility', v)}
          />
          <ContactRow
            label="Instagram"
            icon={Camera}
            value={form.instagram ?? ''}
            onChange={(v) => set('instagram', v || null)}
            placeholder="@username"
            visibility={form.instagramVisibility}
            onVisibilityChange={(v) => set('instagramVisibility', v)}
          />
          <ContactRow
            label="Facebook"
            icon={Users}
            value={form.facebook ?? ''}
            onChange={(v) => set('facebook', v || null)}
            placeholder="username"
            visibility={form.facebookVisibility}
            onVisibilityChange={(v) => set('facebookVisibility', v)}
          />
        </Section>

        <Section title={t('profile.sections.invites')}>
          <p className="text-xs text-neutral-400 mb-3">{t('profile.inviteFrom.title')}</p>
          <div className="space-y-2">
            {(['all', 'contacts', 'none'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set('inviteFrom', opt)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition ${
                  form.inviteFrom === opt
                    ? 'border-accent-500 bg-neutral-50'
                    : 'border-neutral-100 hover:border-accent-500/50'
                }`}
              >
                <p className="text-sm font-semibold text-neutral-900">
                  {t(`profile.inviteFrom.${opt}`)}
                </p>
                <p className="text-xs text-neutral-400">{t(`profile.inviteFrom.${opt}Hint`)}</p>
              </button>
            ))}
          </div>
        </Section>

        <Section title={t('profile.sections.security')}>
          <button
            type="button"
            onClick={() => navigate('/settings/blocked')}
            className="w-full text-left px-4 py-3 rounded-xl border-2 border-neutral-100 hover:border-accent-500/50 transition"
          >
            <p className="text-sm font-semibold text-neutral-900">
              {t('profile.security.blocked')}
            </p>
            <p className="text-xs text-neutral-400">{t('profile.security.blockedHint')}</p>
          </button>
        </Section>
      </main>
    </div>
  );
}

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-neutral-100 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition text-sm';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
      <h2 className="font-display text-sm uppercase tracking-widest text-neutral-400 mb-4">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-neutral-400 mt-1">{hint}</p>}
    </div>
  );
}

function ContactRow({
  label,
  icon,
  value,
  onChange,
  visibility,
  onVisibilityChange,
  placeholder,
  disabled,
}: {
  label: string;
  icon: LucideIcon;
  value: string | null;
  onChange?: (v: string) => void;
  visibility?: Visibility;
  onVisibilityChange: (v: Visibility) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 mb-2">
      {(() => {
        const Icon = icon;
        return <Icon size={18} className="text-neutral-400 shrink-0" />;
      })()}
      <input
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder ?? label}
        className={`${inputCls} ${disabled ? 'bg-neutral-50 text-neutral-400' : ''} flex-1`}
      />
      <select
        value={visibility ?? 'hidden'}
        onChange={(e) => onVisibilityChange(e.target.value as Visibility)}
        className="px-2 py-2.5 rounded-xl border border-neutral-100 text-xs font-medium text-neutral-700 bg-white focus:border-accent-500 outline-none shrink-0"
      >
        <option value="public">{t('profile.visibility.public')}</option>
        <option value="contacts">{t('profile.visibility.contacts')}</option>
        <option value="hidden">{t('profile.visibility.hidden')}</option>
      </select>
    </div>
  );
}
