import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  Heart,
  LogOut,
  Ampersand,
  KeyRound,
  Search,
  MessageCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../shared/store/useAuth';
import { useUnreadCount } from '../shared/api/notifications.hooks';
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

  const hasUnread = unread !== undefined && unread > 0;

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
              {hasUnread && (
                <span className="absolute -top-1 -right-1 bg-brand-gradient text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center ring-2 ring-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
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
          <NavLink to="/rooms" className={itemClass} title={t('nav.titles.spaces') as string}>
            <Ampersand size={20} />
          </NavLink>
          <NavLink to="/search" className={itemClass} title={t('search.title', 'Пошук') as string}>
            <Search size={20} />
          </NavLink>
          <NavLink to="/chat" className={itemClass} title={t('nav.chat') as string}>
            <MessageCircle size={20} />
          </NavLink>
          <NavLink to="/contacts" className={itemClass} title={t('contacts.link') as string}>
            <Users size={20} />
          </NavLink>
          <NavLink to="/events" className={itemClass} title={t('nav.events') as string}>
            <Heart size={20} />
          </NavLink>
        </div>

        {/* ── ВНИЗУ: тільки вихід ───────────────────── */}
        <div className="mt-auto flex flex-col items-center gap-1">
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
