import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Users, Calendar, ShieldCheck, LogOut, ChevronRight } from 'lucide-react';
import { useProfile } from '../shared/api/profile.hooks';
import { useAuth } from '../shared/store/useAuth';
import { relativeTime } from '../shared/lib/relativeTime';
import { cn } from '../shared/ui';
import { useAddContact, useRemoveContact } from '../shared/api/contacts.hooks';
import { useBlockUser } from '../shared/api/blocks.hooks';

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return (p.length >= 2 ? p[0]![0]! + p[1]![0]! : name.slice(0, 2)).toUpperCase();
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function RingAvatar({
  fullName,
  avatarUrl,
  size = 88,
}: {
  fullName: string;
  avatarUrl: string | null;
  size?: number;
}) {
  return (
    <div className="relative rounded-full shrink-0" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#2d6ff8,#8eb5ff,#22c55e,#2d6ff8)] animate-[spin_4s_linear_infinite]" />
      <span
        className="absolute inset-[3px] rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center font-semibold text-neutral-600"
        style={{ fontSize: size * 0.32 }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          initials(fullName)
        )}
      </span>
    </div>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: profile, isLoading, isError } = useProfile(username ?? '');

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-400 animate-pulse">
        {t('common.loading')}
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold text-neutral-900">{t('profile.notFound')}</p>
        <button
          onClick={() => navigate('/rooms')}
          className="bg-accent-500 hover:bg-accent-600 text-white font-semibold px-5 py-2.5 rounded-xl transition"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  const age = calculateAge(profile.birthDate);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="h-full overflow-y-auto bg-neutral-50">
      <main className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-4">
        {/* Header card */}
        <section className="bg-white rounded-card shadow-card p-6">
          <div className="flex items-center gap-5">
            <RingAvatar fullName={profile.fullName} avatarUrl={profile.avatarUrl} />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-neutral-900 truncate">{profile.fullName}</h1>
              <p className="text-neutral-400 text-sm">@{profile.username}</p>
              <p className="text-xs mt-2">
                {profile.isOnline ? (
                  <span className="text-success-700 font-medium">{t('profile.online')}</span>
                ) : (
                  <span className="text-neutral-400">
                    {t('profile.wasOnline', { time: relativeTime(profile.lastSeenAt) })}
                  </span>
                )}
              </p>
            </div>
          </div>

          {!profile.isSelf && (
            <ContactButton
              profileId={profile.id}
              isContact={profile.isContact}
              isMutual={profile.isMutual}
            />
          )}
        </section>

        {profile.isSelf ? (
          <>
            {/* Hub menu */}
            <section className="bg-white rounded-card shadow-card overflow-hidden divide-y divide-neutral-100">
              <MenuRow
                icon={<Pencil size={19} />}
                label={t('profile.menu.personal')}
                onClick={() => navigate('/settings/profile')}
              />
              <MenuRow
                icon={<Users size={19} />}
                label={t('profile.menu.contacts')}
                onClick={() => navigate('/contacts')}
              />
              <MenuRow
                icon={<Calendar size={19} />}
                label={t('profile.menu.calendar')}
                onClick={() => navigate('/calendar')}
              />
              <MenuRow
                icon={<ShieldCheck size={19} />}
                label={t('profile.menu.privacy')}
                onClick={() => navigate('/settings/blocked')}
              />
            </section>

            {/* Logout */}
            <section className="bg-white rounded-card shadow-card overflow-hidden">
              <MenuRow
                icon={<LogOut size={19} />}
                label={t('profile.menu.logout')}
                onClick={handleLogout}
                danger
              />
            </section>
          </>
        ) : (
          <PublicDetails profile={profile} age={age} />
        )}
      </main>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition text-left"
    >
      <span className={cn('shrink-0', danger ? 'text-red-500' : 'text-neutral-500')}>{icon}</span>
      <span
        className={cn('flex-1 text-sm font-medium', danger ? 'text-red-600' : 'text-neutral-900')}
      >
        {label}
      </span>
      {!danger && <ChevronRight size={18} className="text-neutral-300 shrink-0" />}
    </button>
  );
}

/* ---------- Перегляд чужого профілю ---------- */

function PublicDetails({
  profile,
  age,
}: {
  profile: import('../shared/api/profile.api').PublicProfile;
  age: number | null;
}) {
  const { t } = useTranslation();
  const allHobbies = [...profile.hobbies];
  if (profile.hobbiesCustom) allHobbies.push(profile.hobbiesCustom);

  const contacts: { icon: string; label: string; value: string; href: string }[] = [];
  if (profile.email)
    contacts.push({
      icon: '📧',
      label: 'Email',
      value: profile.email,
      href: `mailto:${profile.email}`,
    });
  if (profile.phone)
    contacts.push({
      icon: '📱',
      label: t('auth.phone'),
      value: profile.phone,
      href: `tel:${profile.phone}`,
    });
  if (profile.telegram)
    contacts.push({
      icon: '💬',
      label: 'Telegram',
      value: `@${profile.telegram.replace(/^@/, '')}`,
      href: `https://t.me/${profile.telegram.replace(/^@/, '')}`,
    });
  if (profile.whatsapp)
    contacts.push({
      icon: '🟢',
      label: 'WhatsApp',
      value: profile.whatsapp,
      href: `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`,
    });
  if (profile.instagram)
    contacts.push({
      icon: '📸',
      label: 'Instagram',
      value: `@${profile.instagram.replace(/^@/, '')}`,
      href: `https://instagram.com/${profile.instagram.replace(/^@/, '')}`,
    });
  if (profile.facebook)
    contacts.push({
      icon: '👥',
      label: 'Facebook',
      value: profile.facebook,
      href: `https://facebook.com/${profile.facebook}`,
    });

  const hasMeta =
    age !== null || (profile.gender && profile.gender !== 'unspecified') || profile.city;

  return (
    <>
      {hasMeta && (
        <section className="bg-white rounded-card shadow-card p-5">
          <p className="text-sm text-neutral-700 flex flex-wrap gap-x-4 gap-y-1">
            {age !== null && <span>🎂 {age}</span>}
            {profile.gender && profile.gender !== 'unspecified' && (
              <span>{t(`profile.gender.${profile.gender}`)}</span>
            )}
            {profile.city && <span>📍 {profile.city}</span>}
          </p>
        </section>
      )}

      {profile.bio && (
        <section className="bg-white rounded-card shadow-card p-5">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 mb-2">
            {t('profile.sections.about')}
          </h2>
          <p className="text-neutral-900 text-sm whitespace-pre-line">{profile.bio}</p>
        </section>
      )}

      {allHobbies.length > 0 && (
        <section className="bg-white rounded-card shadow-card p-5">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">
            {t('profile.sections.hobbies')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {allHobbies.map((h, i) => (
              <span
                key={i}
                className="bg-neutral-100 text-neutral-600 text-xs font-medium px-3 py-1 rounded-full"
              >
                {h}
              </span>
            ))}
          </div>
        </section>
      )}

      {contacts.length > 0 && (
        <section className="bg-white rounded-card shadow-card p-5">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">
            {t('profile.sections.contacts')}
          </h2>
          <ul className="space-y-2.5 text-sm">
            {contacts.map((c) => (
              <li key={c.label} className="flex items-center gap-3">
                <span className="text-lg">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider">{c.label}</p>
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-900 hover:text-accent-600 transition truncate block"
                  >
                    {c.value}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!profile.bio && allHobbies.length === 0 && contacts.length === 0 && (
        <section className="bg-white rounded-card shadow-card border border-dashed border-neutral-200 p-8 text-center">
          <p className="text-neutral-400 text-sm">{t('profile.empty')}</p>
        </section>
      )}
    </>
  );
}

function ContactButton({
  profileId,
  isContact,
  isMutual,
}: {
  profileId: string;
  isContact: boolean;
  isMutual: boolean;
}) {
  const { t } = useTranslation();
  const add = useAddContact();
  const remove = useRemoveContact();
  const block = useBlockUser();
  const loading = add.isPending || remove.isPending || block.isPending;

  async function handleBlock() {
    const reason = prompt(t('profile.blockReason'));
    if (reason === null) return;
    await block.mutateAsync({ userId: profileId, reason: reason.trim() || undefined });
    alert(t('profile.blocked'));
    window.history.back();
  }

  return (
    <div className="mt-5 space-y-2">
      {isContact ? (
        <div className="flex gap-2">
          <div className="flex-1 bg-neutral-100 text-neutral-600 font-semibold py-2.5 rounded-xl text-sm text-center">
            {isMutual ? t('profile.mutualContacts') : t('profile.inContacts')}
          </div>
          <button
            onClick={() => remove.mutate(profileId)}
            disabled={loading}
            className="border border-neutral-200 text-red-500 hover:bg-red-50 font-semibold py-2.5 px-4 rounded-xl text-sm transition disabled:opacity-50"
          >
            {remove.isPending ? '…' : t('common.remove')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => add.mutate(profileId)}
          disabled={loading}
          className="w-full bg-accent-500 hover:bg-accent-600 text-white font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
        >
          {add.isPending ? t('profile.adding') : t('profile.addToContacts')}
        </button>
      )}
      <button
        onClick={handleBlock}
        disabled={loading}
        className="w-full text-xs text-red-500 hover:bg-red-50 font-semibold py-2 rounded-lg transition disabled:opacity-50"
      >
        {t('profile.block')}
      </button>
    </div>
  );
}
