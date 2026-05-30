import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProfile } from '../shared/api/profile.hooks';
import { useAuth } from '../shared/store/useAuth';
import { Avatar } from '../shared/ui/Avatar';
import { relativeTime } from '../shared/lib/relativeTime';
import type { PublicProfile } from '../shared/api/profile.api';
import { useAddContact, useRemoveContact } from '../shared/api/contacts.hooks';
import { useBlockUser } from '../shared/api/blocks.hooks';

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

export function ProfilePage() {
  const { t } = useTranslation();
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { data: profile, isLoading, isError } = useProfile(username ?? '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-forest-50 flex items-center justify-center">
        <p className="font-display text-xl text-forest-900 animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-forest-50 flex flex-col items-center justify-center gap-4 px-6">
        <p className="font-display text-xl text-forest-900">{t('profile.notFound')}</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-forest-600 hover:bg-forest-700 text-white font-semibold px-5 py-2.5 rounded-xl transition"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  const age = calculateAge(profile.birthDate);
  const hasAnyContact =
    profile.email ||
    profile.phone ||
    profile.telegram ||
    profile.whatsapp ||
    profile.instagram ||
    profile.facebook;
  const allHobbies = [...profile.hobbies];
  if (profile.hobbiesCustom) {
    allHobbies.push(profile.hobbiesCustom);
  }

  return (
    <div className="min-h-screen bg-forest-50 font-body">
      <header className="bg-white border-b border-forest-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-forest-600 hover:text-forest-900 text-sm font-medium"
          >
            {t('common.back')}
          </button>
          <span className="font-display text-lg font-bold text-forest-900">
            Camp<span className="text-ember-500">Flow</span>
          </span>
          <span className="text-sm text-forest-700 truncate max-w-[120px]">
            {currentUser?.fullName}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <section className="bg-white rounded-2xl border border-forest-100 shadow-sm p-6 mb-4">
          <div className="flex items-start gap-5">
            <Avatar
              fullName={profile.fullName}
              avatarUrl={profile.avatarUrl}
              size={96}
              isOnline={profile.isOnline}
              showStatus
            />
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-bold text-forest-900 truncate">
                {profile.fullName}
              </h1>
              <p className="text-forest-500 text-sm">@{profile.username}</p>
              <p className="text-xs text-forest-500 mt-2">
                {profile.isOnline ? (
                  <span className="text-forest-700">{t('profile.online')}</span>
                ) : (
                  <>{t('profile.wasOnline', { time: relativeTime(profile.lastSeenAt) })}</>
                )}
              </p>

              {(age !== null || profile.gender || profile.city) && (
                <p className="text-sm text-forest-700 mt-3 flex flex-wrap gap-x-3 gap-y-1">
                  {age !== null && <span>🎂 {age}</span>}
                  {profile.gender && profile.gender !== 'unspecified' && (
                    <span>{t(`profile.gender.${profile.gender}`)}</span>
                  )}
                  {profile.city && <span>📍 {profile.city}</span>}
                </p>
              )}
            </div>
          </div>

          {!profile.isSelf && (
            <ContactButton
              profileId={profile.id}
              isContact={profile.isContact}
              isMutual={profile.isMutual}
            />
          )}
          {profile.isSelf && (
            <button
              onClick={() => navigate('/settings/profile')}
              className="mt-5 w-full border border-forest-500 text-forest-700 hover:bg-forest-50 font-semibold py-2 rounded-xl text-sm transition"
            >
              {t('profile.edit')}
            </button>
          )}
        </section>

        {profile.bio && (
          <section className="bg-white rounded-2xl border border-forest-100 shadow-sm p-6 mb-4">
            <h2 className="font-display text-sm uppercase tracking-widest text-forest-500 mb-2">
              {t('profile.sections.about')}
            </h2>
            <p className="text-forest-900 text-sm whitespace-pre-line">{profile.bio}</p>
          </section>
        )}

        {allHobbies.length > 0 && (
          <section className="bg-white rounded-2xl border border-forest-100 shadow-sm p-6 mb-4">
            <h2 className="font-display text-sm uppercase tracking-widest text-forest-500 mb-3">
              {t('profile.sections.hobbies')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {allHobbies.map((h, idx) => (
                <span
                  key={idx}
                  className="bg-forest-50 text-forest-700 text-xs font-medium px-3 py-1 rounded-full"
                >
                  {h}
                </span>
              ))}
            </div>
          </section>
        )}

        {hasAnyContact && (
          <section className="bg-white rounded-2xl border border-forest-100 shadow-sm p-6">
            <h2 className="font-display text-sm uppercase tracking-widest text-forest-500 mb-3">
              {t('profile.sections.contacts')}
            </h2>
            <ul className="space-y-2.5 text-sm">
              {profile.email && (
                <ContactRow
                  icon="📧"
                  label="Email"
                  value={profile.email}
                  href={`mailto:${profile.email}`}
                />
              )}
              {profile.phone && (
                <ContactRow
                  icon="📱"
                  label={t('profile.fields.gender') /* placeholder */}
                  value={profile.phone}
                  href={`tel:${profile.phone}`}
                />
              )}
              {profile.telegram && (
                <ContactRow
                  icon="💬"
                  label="Telegram"
                  value={`@${profile.telegram.replace(/^@/, '')}`}
                  href={`https://t.me/${profile.telegram.replace(/^@/, '')}`}
                />
              )}
              {profile.whatsapp && (
                <ContactRow
                  icon="🟢"
                  label="WhatsApp"
                  value={profile.whatsapp}
                  href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                />
              )}
              {profile.instagram && (
                <ContactRow
                  icon="📸"
                  label="Instagram"
                  value={`@${profile.instagram.replace(/^@/, '')}`}
                  href={`https://instagram.com/${profile.instagram.replace(/^@/, '')}`}
                />
              )}
              {profile.facebook && (
                <ContactRow
                  icon="👥"
                  label="Facebook"
                  value={profile.facebook}
                  href={`https://facebook.com/${profile.facebook}`}
                />
              )}
            </ul>
          </section>
        )}

        {!profile.bio && allHobbies.length === 0 && !hasAnyContact && !profile.isSelf && (
          <section className="bg-white rounded-2xl border border-forest-100 border-dashed p-8 text-center">
            <p className="text-forest-500 text-sm">{t('profile.empty')}</p>
          </section>
        )}

        {profile.isSelf && !profile.bio && allHobbies.length === 0 && !hasAnyContact && (
          <section className="bg-white rounded-2xl border border-forest-100 border-dashed p-8 text-center">
            <p className="text-forest-700 text-sm mb-1">{t('profile.emptySelf')}</p>
            <p className="text-forest-500 text-xs">{t('profile.emptySelfHint')}</p>
          </section>
        )}
      </main>
    </div>
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

  if (isContact) {
    return (
      <div className="mt-5 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 bg-forest-50 text-forest-700 font-semibold py-2 rounded-xl text-sm text-center flex items-center justify-center gap-1.5">
            {isMutual ? t('profile.mutualContacts') : t('profile.inContacts')}
          </div>
          <button
            onClick={() => remove.mutate(profileId)}
            disabled={loading}
            className="border border-forest-100 text-red-500 hover:bg-red-50 font-semibold py-2 px-4 rounded-xl text-sm transition disabled:opacity-50"
          >
            {remove.isPending ? '…' : t('common.remove')}
          </button>
        </div>
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

  return (
    <div className="mt-5 space-y-2">
      <button
        onClick={() => add.mutate(profileId)}
        disabled={loading}
        className="w-full bg-ember-500 hover:bg-ember-400 text-white font-semibold py-2 rounded-xl text-sm transition disabled:opacity-50"
      >
        {add.isPending ? t('profile.adding') : t('profile.addToContacts')}
      </button>
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

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-forest-500 uppercase tracking-wider">{label}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forest-900 hover:text-forest-600 transition truncate block"
        >
          {value}
        </a>
      </div>
    </li>
  );
}
