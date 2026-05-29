import { useParams, useNavigate } from 'react-router-dom';
import { useProfile } from '../shared/api/profile.hooks';
import { useAuth } from '../shared/store/useAuth';
import { Avatar } from '../shared/ui/Avatar';
import { relativeTime } from '../shared/lib/relativeTime';
import type { PublicProfile } from '../shared/api/profile.api';
import { useAddContact, useRemoveContact } from '../shared/api/contacts.hooks';

const GENDER_LABELS: Record<NonNullable<PublicProfile['gender']>, string> = {
  male: 'Чоловіча',
  female: 'Жіноча',
  unspecified: 'Не вказано',
};

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
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { data: profile, isLoading, isError } = useProfile(username ?? '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-forest-50 flex items-center justify-center">
        <p className="font-display text-xl text-forest-900 animate-pulse">Завантаження профілю…</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-forest-50 flex flex-col items-center justify-center gap-4 px-6">
        <p className="font-display text-xl text-forest-900">Користувача не знайдено</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-forest-600 hover:bg-forest-700 text-white font-semibold px-5 py-2.5 rounded-xl transition"
        >
          ← Назад
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
      {/* Хедер */}
      <header className="bg-white border-b border-forest-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-forest-600 hover:text-forest-900 text-sm font-medium"
          >
            ← Назад
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
        {/* Шапка профілю */}
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
                  <span className="text-forest-700">● онлайн</span>
                ) : (
                  <>був(-ла) {relativeTime(profile.lastSeenAt)}</>
                )}
              </p>

              {/* Базові факти */}
              {(age !== null || profile.gender || profile.city) && (
                <p className="text-sm text-forest-700 mt-3 flex flex-wrap gap-x-3 gap-y-1">
                  {age !== null && <span>🎂 {age} р.</span>}
                  {profile.gender && profile.gender !== 'unspecified' && (
                    <span>{GENDER_LABELS[profile.gender]}</span>
                  )}
                  {profile.city && <span>📍 {profile.city}</span>}
                </p>
              )}
            </div>
          </div>

          {/* Кнопки дій */}
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
              ✎ Редагувати профіль
            </button>
          )}
        </section>

        {/* Bio */}
        {profile.bio && (
          <section className="bg-white rounded-2xl border border-forest-100 shadow-sm p-6 mb-4">
            <h2 className="font-display text-sm uppercase tracking-widest text-forest-500 mb-2">
              Про себе
            </h2>
            <p className="text-forest-900 text-sm whitespace-pre-line">{profile.bio}</p>
          </section>
        )}

        {/* Хоббі */}
        {allHobbies.length > 0 && (
          <section className="bg-white rounded-2xl border border-forest-100 shadow-sm p-6 mb-4">
            <h2 className="font-display text-sm uppercase tracking-widest text-forest-500 mb-3">
              Хоббі
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

        {/* Контакти */}
        {hasAnyContact && (
          <section className="bg-white rounded-2xl border border-forest-100 shadow-sm p-6">
            <h2 className="font-display text-sm uppercase tracking-widest text-forest-500 mb-3">
              Контакти
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
                  label="Телефон"
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

        {/* Стан коли все приховано */}
        {!profile.bio && allHobbies.length === 0 && !hasAnyContact && !profile.isSelf && (
          <section className="bg-white rounded-2xl border border-forest-100 border-dashed p-8 text-center">
            <p className="text-forest-500 text-sm">
              Користувач ще не заповнив профіль або приховав інформацію.
            </p>
          </section>
        )}

        {profile.isSelf && !profile.bio && allHobbies.length === 0 && !hasAnyContact && (
          <section className="bg-white rounded-2xl border border-forest-100 border-dashed p-8 text-center">
            <p className="text-forest-700 text-sm mb-1">Ваш профіль порожній 🌱</p>
            <p className="text-forest-500 text-xs">
              Розкажіть про себе, додайте хоббі й контакти — це допоможе друзям знайти спільне.
              Редагування з'явиться в наступному блоці.
            </p>
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
  const add = useAddContact();
  const remove = useRemoveContact();
  const loading = add.isPending || remove.isPending;

  if (isContact) {
    return (
      <div className="mt-5 flex gap-2">
        <div className="flex-1 bg-forest-50 text-forest-700 font-semibold py-2 rounded-xl text-sm text-center flex items-center justify-center gap-1.5">
          {isMutual ? '🔁 Взаємно в контактах' : '✓ У контактах'}
        </div>
        <button
          onClick={() => remove.mutate(profileId)}
          disabled={loading}
          className="border border-forest-100 text-red-500 hover:bg-red-50 font-semibold py-2 px-4 rounded-xl text-sm transition disabled:opacity-50"
        >
          {remove.isPending ? '…' : 'Видалити'}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 flex gap-2">
      <button
        onClick={() => add.mutate(profileId)}
        disabled={loading}
        className="flex-1 bg-ember-500 hover:bg-ember-400 text-white font-semibold py-2 rounded-xl text-sm transition disabled:opacity-50"
      >
        {add.isPending ? 'Додаю…' : '+ Додати в контакти'}
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
