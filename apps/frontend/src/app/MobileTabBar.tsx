import { NavLink, useLocation } from 'react-router-dom';
import { MessageCircle, Heart, User, Ampersand } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <motion.div
      className="relative flex items-center justify-center w-10 h-10"
      whileTap={{ scale: 0.78 }}
      transition={spring}
    >
      <motion.div
        animate={{ scale: isActive ? 1.12 : 1, color: isActive ? '#1a56e0' : '#9aa1b1' }}
        transition={spring}
        className="flex items-center justify-center"
      >
        {children}
      </motion.div>
      {isActive && (
        <motion.span
          layoutId="tab-dot"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-600"
          transition={spring}
        />
      )}
    </motion.div>
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
    <nav className="flex md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white border-t border-neutral-100 pb-[env(safe-area-inset-bottom)]">
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
              <span className="absolute -top-1.5 -right-2 bg-brand-gradient text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                {(unread ?? 0) > 99 ? '99+' : unread}
              </span>
            )}
          </div>
        </TabIcon>
      </NavLink>
    </nav>
  );
}
