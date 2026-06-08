import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Plus, Users, Heart, Settings, LogOut, Bell, Ampersand, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../shared/store/useAuth';
import { useUnreadCount } from '../shared/api/notifications.hooks';
import { useLang } from '../shared/lib/useLang';
import { cn } from '../shared/ui';
import { getMediaUrl } from '../shared/lib/getMediaUrl';
import { JoinRoomModal } from '../pages/rooms/JoinRoomModal';

interface Props {
  onCreateRoom: () => void;
}

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center justify-center w-11 h-11 rounded-xl transition-colors',
    isActive
      ? 'bg-accent-50 text-accent-600'
      : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600',
  );

function initials(name?: string) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

const LANG_LABEL: Record<string, string> = { uk: 'Ukr', ru: 'Ru', en: 'En' };

function NavLanguage() {
  const { current, change, supported } = useLang();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={t(`language.${current}`)}
        className="flex items-center justify-center w-11 h-11 rounded-xl text-xs font-semibold uppercase text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
      >
        {LANG_LABEL[current] ?? current}
      </button>
      {open && (
        <ul className="absolute left-full bottom-0 ml-2 bg-white border border-neutral-200 rounded-xl shadow-card-lg overflow-hidden z-50 min-w-[130px]">
          {supported.map((lang) => (
            <li key={lang}>
              <button
                onClick={() => {
                  change(lang);
                  setOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 transition',
                  current === lang
                    ? 'bg-neutral-50 text-neutral-900 font-semibold'
                    : 'text-neutral-700',
                )}
              >
                {t(`language.${lang}`)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DesktopNav({ onCreateRoom }: Props) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: unread } = useUnreadCount();
  const [showJoin, setShowJoin] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <>
      <nav className="hidden md:flex w-[10vw] min-w-[72px] max-w-[110px] shrink-0 flex-col items-center py-4 bg-white border-r border-neutral-100">
        {/* ── ВГОРУ: профіль + дії ───────────────────── */}
        <div className="flex flex-col items-center gap-1">
          {user?.username && (
            <NavLink
              to={`/u/${user.username}`}
              title={user.fullName}
              className="relative w-11 h-11 rounded-full mb-1 shrink-0"
            >
              <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#2d6ff8,#8eb5ff,#22c55e,#2d6ff8)] animate-[spin_4s_linear_infinite]" />
              <span className="absolute inset-[2px] rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center text-sm font-semibold text-neutral-600">
                {user.avatarUrl ? (
                  <img src={getMediaUrl(user.avatarUrl)} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials(user.fullName)
                )}
              </span>
            </NavLink>
          )}
          <button
            onClick={onCreateRoom}
            title={t('rooms.newRoom') as string}
            className="w-11 h-11 rounded-xl bg-brand-gradient hover:bg-brand-gradient-hover text-white flex items-center justify-center transition-colors shadow-fab"
          >
            <Plus size={22} />
          </button>
          <button
            onClick={() => setShowJoin(true)}
            title={t('rooms.joinByCode') as string}
            className="flex items-center justify-center w-11 h-11 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
          >
            <KeyRound size={18} />
          </button>
        </div>

        {/* divider */}
        <div className="w-8 h-px bg-neutral-100 my-3" />

        {/* ── ПОСЕРЕДИНІ: основні розділи ────────────── */}
        <div className="flex flex-col items-center gap-1">
          <NavLink to="/rooms" className={itemClass} title="& Spaces">
            <Ampersand size={20} />
          </NavLink>
          <NavLink to="/contacts" className={itemClass} title={t('contacts.link') as string}>
            <Users size={20} />
          </NavLink>
          <NavLink to="/events" className={itemClass} title={t('nav.events') as string}>
            <Heart size={20} />
          </NavLink>
          <NavLink to="/notifications" className={itemClass} title={t('notifications.title') as string}>
            <div className="relative">
              <Bell size={20} />
              {unread !== undefined && unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-gradient text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </div>
          </NavLink>
        </div>

        {/* ── ВНИЗУ: налаштування / мова / вихід ─────── */}
        <div className="mt-auto flex flex-col items-center gap-1">
          <div className="w-8 h-px bg-neutral-100 mb-3" />
          <NavLink to="/settings/profile" className={itemClass} title={t('profile.settings') as string}>
            <Settings size={20} />
          </NavLink>
          <NavLanguage />
          <button
            onClick={handleLogout}
            title={t('common.logout') as string}
            className="flex items-center justify-center w-11 h-11 rounded-xl text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {showJoin && (
        <JoinRoomModal
          onClose={() => setShowJoin(false)}
          onJoined={(id) => {
            setShowJoin(false);
            navigate(`/rooms/${id}`);
          }}
        />
      )}
    </>
  );
}
