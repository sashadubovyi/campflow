import { NavLink, useLocation } from 'react-router-dom';
import { MessageCircle, Heart, User, Ampersand } from 'lucide-react';
import { m } from 'framer-motion';
import { useAuth } from '../shared/store/useAuth';
import { useUnreadCount } from '../shared/api/notifications.hooks';

const spring = { type: 'spring', stiffness: 500, damping: 30 } as const;

const NAV_TABS = [
  { to: '/rooms', Icon: Ampersand, label: 'Spaces' },
  { to: '/chat', Icon: MessageCircle, label: 'Chat' },
  { to: '/events', Icon: Heart, label: 'Events' },
] as const;

function TabIcon({ isActive, children }: { isActive: boolean; children: React.ReactNode }) {
  return (
    <m.div
      className="relative flex items-center justify-center w-11 h-11 rounded-2xl overflow-hidden"
      whileTap={{ scale: 0.80 }}
      transition={spring}
    >
      <m.span
        className="absolute inset-0 rounded-2xl"
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={spring}
        style={{
          background: 'rgba(45,111,248,0.12)',
          border: isActive ? '1px solid rgba(45,111,248,0.24)' : 'none',
          backdropFilter: 'blur(8px)',
        }}
      />
      <m.div
        animate={{ scale: isActive ? 1.1 : 1, color: isActive ? '#1a56e0' : '#9aa1b1' }}
        transition={spring}
        className="relative flex items-center justify-center"
      >
        {children}
      </m.div>
    </m.div>
  );
}

export function MobileTabBar() {
  const { user } = useAuth();
  const location = useLocation();
  const { data: unread } = useUnreadCount();
  const hasUnread = unread !== undefined && unread > 0;

  const profilePath = user?.username ? `/u/${user.username}` : '/rooms';
  const isProfileActive =
    location.pathname === profilePath || location.pathname === `/u/${user?.username}`;

  return (
    <nav className="flex md:hidden fixed bottom-0 inset-x-0 z-40 h-14 glass-tabbar pb-[env(safe-area-inset-bottom)]">
      {NAV_TABS.map(({ to, Icon, label }) => {
        const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
        return (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className="flex items-center justify-center flex-1 h-full"
          >
            <TabIcon isActive={isActive}>
              <Icon size={22} />
            </TabIcon>
          </NavLink>
        );
      })}

      <NavLink
        to={profilePath}
        aria-label="Profile"
        className="flex items-center justify-center flex-1 h-full"
      >
        <TabIcon isActive={isProfileActive}>
          <div className="relative">
            <User size={22} />
            {hasUnread && (
              <span className="absolute -top-1.5 -right-2 bg-accent-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                {(unread ?? 0) > 99 ? '99+' : unread}
              </span>
            )}
          </div>
        </TabIcon>
      </NavLink>
    </nav>
  );
}
