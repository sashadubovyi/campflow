import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { m, useScroll, useTransform } from 'framer-motion';
import {
  Mail,
  Phone,
  Send,
  MessageCircle,
  Camera,
  Users,
  Cake,
  MapPin,
  Pencil,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Eye,
  QrCode,
  Bell,
  Globe,
  MessageSquare,
  LockOpen,
  UserCheck,
  UserPlus,
  UserMinus,
  ShieldX,
  type LucideIcon,
} from 'lucide-react';
import { ProfileQRModal } from './profile/ProfileQRModal';
import { useUnreadCount } from '../shared/api/notifications.hooks';
import { useProfile, useMyProfile } from '../shared/api/profile.hooks';
import type { PublicProfile, MyProfile, Visibility } from '../shared/api/profile.api';
import { useAuth } from '../shared/store/useAuth';
import { relativeTime } from '../shared/lib/relativeTime';
import { cn, BackButton } from '../shared/ui';
import { Skeleton } from '../shared/ui/Skeleton';
import { Modal } from '../shared/ui/Modal';
import { useAddContact, useRemoveContact } from '../shared/api/contacts.hooks';
import { useBlockUser, useUnblockUser } from '../shared/api/blocks.hooks';
import { getMediaUrl } from '../shared/lib/getMediaUrl';

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return (p.length >= 2 ? p[0]![0]! + p[1]![0]! : name.slice(0, 2)).toUpperCase();
}

function maskAsPublic(profile: PublicProfile, my: MyProfile | undefined): PublicProfile {
  if (!my) return profile;
  const onlyIfPublic = (visibility: Visibility, value: string | null) =>
    visibility === 'public' ? value : null;
  return {
    ...profile,
    email: onlyIfPublic(my.emailVisibility, profile.email),
    phone: onlyIfPublic(my.phoneVisibility, profile.phone),
    telegram: onlyIfPublic(my.telegramVisibility, profile.telegram),
    whatsapp: onlyIfPublic(my.whatsappVisibility, profile.whatsapp),
    instagram: onlyIfPublic(my.instagramVisibility, profile.instagram),
    facebook: onlyIfPublic(my.facebookVisibility, profile.facebook),
  };
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

// Зміни: ring відображається тільки для онлайн-користувачів
function RingAvatar({
  fullName,
  avatarUrl,
  size = 88,
  isOnline = false,
}: {
  fullName: string;
  avatarUrl: string | null;
  size?: number;
  isOnline?: boolean;
}) {
  return (
    <div className="relative rounded-full shrink-0" style={{ width: size, height: size }}>
      {isOnline && (
        <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#2d6ff8,#8eb5ff,#22c55e,#2d6ff8)] animate-[spin_4s_linear_infinite]" />
      )}
      <span
        className="absolute rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center font-semibold text-neutral-600"
        style={{
          inset: isOnline ? 3 : 0,
          fontSize: size * 0.32,
        }}
      >
        {avatarUrl ? (
          <img src={getMediaUrl(avatarUrl)} alt="" className="w-full h-full object-cover" />
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
  const { data: myProfile } = useMyProfile();
  const [showPreview, setShowPreview] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const { data: unread } = useUnreadCount();

  // Scroll-based collapsing header (Telegram iOS style)
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const headerBgOpacity = useTransform(scrollY, [40, 120], [0, 1]);
  const titleOpacity = useTransform(scrollY, [80, 160], [0, 1]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (!username || isLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="glass-header shadow-[0_0.5px_0_rgba(0,0,0,0.06)] shrink-0 h-12" />
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
          <div className="flex flex-col items-center pt-4 pb-6 space-y-3">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="glass-card p-5 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="glass-card p-5 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold text-neutral-900">{t('profile.notFound')}</p>
        <button
          onClick={() => navigate('/rooms')}
          className="btn-glass-blue font-semibold px-5 py-2.5 rounded-xl"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  const age = calculateAge(profile.birthDate);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Collapsing header — always visible, background fades in on scroll */}
      <header className="shrink-0 relative z-10 h-12 flex items-center px-2 md:px-4">
        <m.div
          className="absolute inset-0 glass-header shadow-[0_0.5px_0_rgba(0,0,0,0.06)] pointer-events-none"
          style={{ opacity: headerBgOpacity }}
        />
        {/* Left slot */}
        <div className="relative z-10 w-10 flex items-center">
          {!profile.isSelf && <BackButton />}
        </div>
        {/* Animated title */}
        <m.h1
          style={{ opacity: titleOpacity }}
          className="relative z-10 flex-1 text-center font-display text-base font-bold text-neutral-900 truncate px-2"
        >
          {profile.fullName}
        </m.h1>
        {/* Right slot */}
        <div className="relative z-10 w-10 flex items-center justify-end">
          {profile.isSelf && (
            <button
              onClick={() => navigate('/settings/profile')}
              className="glass-icon w-9 h-9 flex items-center justify-center rounded-xl"
            >
              <Pencil size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Hero — avatar scrolls naturally away, triggering header animation */}
        <div className="flex flex-col items-center px-6 pt-8 pb-4">
          <RingAvatar fullName={profile.fullName} avatarUrl={profile.avatarUrl} size={96} isOnline={profile.isOnline} />
          <h1 className="mt-4 font-display text-2xl font-bold text-neutral-900 text-center">
            {profile.fullName}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">@{profile.username}</p>
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

        <main className="px-4 md:px-6 pb-6 space-y-4">
          {/* ContactButton for other users */}
          {!profile.isSelf && (
            <section className="glass-card p-4">
              <ContactButton
                profileId={profile.id}
                profileUsername={profile.username}
                isContact={profile.isContact}
                isMutual={profile.isMutual}
                isBlockedByMe={profile.isBlockedByMe}
              />
            </section>
          )}

          {/* Stats */}
          <section className="glass-card overflow-hidden">
            <ProfileStats profile={profile} />
          </section>

          {profile.isSelf ? (
            <>
              {/* Hub menu */}
              <section className="glass-card overflow-hidden divide-y divide-neutral-100">
                <MenuRow
                  icon={<Eye size={19} />}
                  label={t('profile.menu.viewPublic')}
                  onClick={() => setShowPreview(true)}
                />
                <MenuRow
                  icon={<QrCode size={19} />}
                  label={t('profile.menu.qr', 'QR код профілю')}
                  onClick={() => setShowQr(true)}
                />
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
                  icon={<Bell size={19} />}
                  label={t('profile.menu.notifications', 'Сповіщення')}
                  onClick={() => navigate('/notifications')}
                  badge={unread}
                />
                <MenuRow
                  icon={<Globe size={19} />}
                  label={t('profile.menu.language', 'Мова')}
                  onClick={() => navigate('/settings/language')}
                  hint={t(`language.${myProfile?.locale ?? 'uk'}`) as string}
                />
                <MenuRow
                  icon={<ShieldCheck size={19} />}
                  label={t('profile.menu.privacy')}
                  onClick={() => navigate('/settings/blocked')}
                />
              </section>

              {/* Logout */}
              <section className="glass-card overflow-hidden">
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

      {/* Public preview modal */}
      <Modal
        open={showPreview && profile.isSelf}
        onClose={() => setShowPreview(false)}
        title={t('profile.menu.viewPublic')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-5">
            <RingAvatar fullName={profile.fullName} avatarUrl={profile.avatarUrl} size={80} isOnline={profile.isOnline} />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-neutral-900 truncate">{profile.fullName}</h2>
              <p className="text-neutral-400 text-sm">@{profile.username}</p>
            </div>
          </div>
          <PublicDetails profile={maskAsPublic(profile, myProfile)} age={age} />
          <button
            onClick={() => { setShowPreview(false); navigate('/settings/profile'); }}
            className="w-full btn-glass-blue py-3 rounded-xl text-sm"
          >
            {t('profile.menu.personal')}
          </button>
        </div>
      </Modal>

      <ProfileQRModal
        open={showQr}
        onClose={() => setShowQr(false)}
        username={profile.username}
      />
    </div>
  );
}

function ProfileStats({ profile }: { profile: PublicProfile }) {
  const { t, i18n } = useTranslation();
  const localeMap: Record<string, string> = { uk: 'uk-UA', en: 'en-US', ru: 'ru-RU' };
  const memberSince = new Date(profile.createdAt).toLocaleDateString(
    localeMap[i18n.language] ?? 'uk-UA',
    { month: 'long', year: 'numeric' },
  );

  return (
    <div className="grid grid-cols-3 gap-3 px-5 py-4">
      <div className="text-center">
        <p className="text-xl font-bold text-neutral-900">{profile.stats.sharedRooms}</p>
        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">
          {profile.isSelf
            ? t('profile.stats.myRooms', 'мої кімнати')
            : t('profile.stats.shared', 'спільні')}
        </p>
      </div>
      <div className="text-center border-x border-neutral-100">
        <p className="text-xl font-bold text-neutral-900">{profile.stats.contacts}</p>
        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">
          {t('profile.stats.contacts', 'контактів')}
        </p>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-neutral-700 leading-tight">{memberSince}</p>
        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">
          {t('profile.stats.memberSince', 'з нами з')}
        </p>
      </div>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
  danger,
  badge,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  badge?: number;
  hint?: string;
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
      {hint && <span className="text-xs text-neutral-400 mr-1">{hint}</span>}
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent-500 text-white text-[10px] font-bold mr-1">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {!danger && <ChevronRight size={18} className="text-neutral-300 shrink-0" />}
    </button>
  );
}

/* ---------- Перегляд чужого профілю ---------- */

function PublicDetails({
  profile,
  age,
}: {
  profile: PublicProfile;
  age: number | null;
}) {
  const { t } = useTranslation();
  const allHobbies = [...profile.hobbies];
  if (profile.hobbiesCustom) allHobbies.push(profile.hobbiesCustom);

  const contacts: { icon: LucideIcon; label: string; value: string; href: string }[] = [];
  if (profile.email)
    contacts.push({
      icon: Mail,
      label: 'Email',
      value: profile.email,
      href: `mailto:${profile.email}`,
    });
  if (profile.phone)
    contacts.push({
      icon: Phone,
      label: t('auth.phone'),
      value: profile.phone,
      href: `tel:${profile.phone}`,
    });
  if (profile.telegram)
    contacts.push({
      icon: Send,
      label: 'Telegram',
      value: `@${profile.telegram.replace(/^@/, '')}`,
      href: `https://t.me/${profile.telegram.replace(/^@/, '')}`,
    });
  if (profile.whatsapp)
    contacts.push({
      icon: MessageCircle,
      label: 'WhatsApp',
      value: profile.whatsapp,
      href: `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`,
    });
  if (profile.instagram)
    contacts.push({
      icon: Camera,
      label: 'Instagram',
      value: `@${profile.instagram.replace(/^@/, '')}`,
      href: `https://instagram.com/${profile.instagram.replace(/^@/, '')}`,
    });
  if (profile.facebook)
    contacts.push({
      icon: Users,
      label: 'Facebook',
      value: profile.facebook,
      href: `https://facebook.com/${profile.facebook}`,
    });

  const hasMeta =
    age !== null || (profile.gender && profile.gender !== 'unspecified') || profile.city;

  return (
    <>
      {hasMeta && (
        <section className="glass-card p-5">
          <p className="text-sm text-neutral-700 flex flex-wrap gap-x-4 gap-y-1">
            {age !== null && (
              <span className="flex items-center gap-1">
                <Cake size={14} />
                {age}
              </span>
            )}
            {profile.gender && profile.gender !== 'unspecified' && (
              <span>{t(`profile.gender.${profile.gender}`)}</span>
            )}
            {profile.city && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {profile.city}
              </span>
            )}
          </p>
        </section>
      )}

      {profile.bio && (
        <section className="glass-card p-5">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 mb-2">
            {t('profile.sections.about')}
          </h2>
          <p className="text-neutral-900 text-sm whitespace-pre-line">{profile.bio}</p>
        </section>
      )}

      {allHobbies.length > 0 && (
        <section className="glass-card p-5">
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
        <section className="glass-card p-5">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">
            {t('profile.sections.contacts')}
          </h2>
          <ul className="space-y-2.5 text-sm">
            {contacts.map((c) => (
              <li key={c.label} className="flex items-center gap-3">
                <span className="shrink-0">
                  {(() => {
                    const Icon = c.icon;
                    return <Icon size={18} className="text-neutral-400" />;
                  })()}
                </span>
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
        <section className="glass-card border border-dashed border-neutral-200 p-8 text-center">
          <p className="text-neutral-400 text-sm">{t('profile.empty')}</p>
        </section>
      )}
    </>
  );
}

function ContactButton({
  profileId,
  profileUsername,
  isContact,
  isMutual,
  isBlockedByMe,
}: {
  profileId: string;
  profileUsername: string;
  isContact: boolean;
  isMutual: boolean;
  isBlockedByMe?: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const add = useAddContact();
  const remove = useRemoveContact();
  const block = useBlockUser();
  const unblock = useUnblockUser();
  const loading = add.isPending || remove.isPending || block.isPending || unblock.isPending;

  async function handleBlock() {
    const reason = prompt(t('profile.blockReason'));
    if (reason === null) return;
    await block.mutateAsync({ userId: profileId, reason: reason.trim() || undefined });
    alert(t('profile.blocked'));
    window.history.back();
  }

  if (isBlockedByMe) {
    return (
      <button
        onClick={() => unblock.mutate(profileId)}
        disabled={unblock.isPending}
        className="w-full flex items-center justify-center gap-2 border border-yellow-300/60 bg-yellow-50/50 backdrop-blur-sm text-yellow-600 hover:bg-yellow-50 font-semibold py-2.5 rounded-2xl text-sm transition disabled:opacity-50"
      >
        <LockOpen size={16} />
        {unblock.isPending ? '…' : t('profile.unblock', 'Розблокувати')}
      </button>
    );
  }

  // Зміни: мобільна версія — тільки іконки в один рядок
  return (
    <div className="flex gap-2">
      {/* Add / status button */}
      {isContact ? (
        <div className="flex-1 flex items-center justify-center gap-1.5 bg-white/40 border border-white/60 backdrop-blur-sm text-neutral-600 font-semibold py-2.5 rounded-2xl text-sm">
          {/* Desktop: show text; mobile: show icon */}
          <UserCheck size={16} className="shrink-0" />
          <span className="hidden sm:inline text-sm">
            {isMutual ? t('profile.mutualContacts') : t('profile.inContacts')}
          </span>
        </div>
      ) : (
        <button
          onClick={() => add.mutate(profileId)}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 btn-glass-blue py-2.5 rounded-2xl text-sm disabled:opacity-50"
        >
          <UserPlus size={16} className="shrink-0" />
          <span className="hidden sm:inline">
            {add.isPending ? t('profile.adding') : t('profile.addToContacts')}
          </span>
        </button>
      )}

      {/* Remove (only when in contacts) */}
      {isContact && (
        <button
          onClick={() => remove.mutate(profileId)}
          disabled={loading}
          title={t('common.remove')}
          className="flex items-center justify-center w-11 h-11 rounded-2xl bg-danger-500/10 border border-danger-500/25 text-danger-600 hover:bg-danger-500/18 transition disabled:opacity-50 shrink-0"
        >
          <UserMinus size={16} />
        </button>
      )}

      {/* Chat */}
      <button
        onClick={() => navigate(`/dm/${profileUsername}`)}
        title={t('profile.sendMessage', 'Написати повідомлення')}
        className="flex items-center justify-center w-11 h-11 rounded-2xl bg-accent-500/10 border border-accent-500/25 text-accent-600 hover:bg-accent-500/18 transition shrink-0"
      >
        <MessageSquare size={16} />
      </button>

      {/* Block */}
      <button
        onClick={handleBlock}
        disabled={loading}
        title={t('profile.block')}
        className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/40 border border-white/60 backdrop-blur-sm text-neutral-500 hover:bg-danger-500/10 hover:text-danger-600 hover:border-danger-500/25 transition disabled:opacity-50 shrink-0"
      >
        <ShieldX size={16} />
      </button>
    </div>
  );
}
