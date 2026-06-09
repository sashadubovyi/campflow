import { NavLink } from 'react-router-dom';
import { MessageCircle, Heart, User, Ampersand } from 'lucide-react';
import { useAuth } from '../shared/store/useAuth';
import { useUnreadCount } from '../shared/api/notifications.hooks';
import { cn } from '../shared/ui';

const itemCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center justify-center flex-1 h-full transition-colors',
    isActive ? 'text-accent-600' : 'text-neutral-400',
  );

export function MobileTabBar() {
  const { user } = useAuth();
  const { data: unread } = useUnreadCount();
  const hasUnread = unread !== undefined && unread > 0;

  return (
    <nav className="flex md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white border-t border-neutral-100 pb-[env(safe-area-inset-bottom)]">
      <NavLink to="/rooms" className={itemCls} aria-label="Spaces">
        <Ampersand size={24} />
      </NavLink>
      <NavLink to="/chat" className={itemCls} aria-label="Chat">
        <MessageCircle size={24} />
      </NavLink>
      <NavLink to="/events" className={itemCls} aria-label="My events">
        <Heart size={24} />
      </NavLink>
      <NavLink
        to={user?.username ? `/u/${user.username}` : '/rooms'}
        className={itemCls}
        aria-label="Profile"
      >
        <div className="relative">
          <User size={24} />
          {hasUnread && (
            <span className="absolute -top-1.5 -right-2 bg-brand-gradient text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </NavLink>
    </nav>
  );
}
