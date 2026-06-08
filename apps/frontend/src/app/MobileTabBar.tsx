import { NavLink } from 'react-router-dom';
import { MessageCircle, Heart, User, Ampersand } from 'lucide-react';
import { useAuth } from '../shared/store/useAuth';
import { cn } from '../shared/ui';

const itemCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center justify-center flex-1 h-full transition-colors',
    isActive ? 'text-accent-600' : 'text-neutral-400',
  );

export function MobileTabBar() {
  const { user } = useAuth();

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
        <User size={24} />
      </NavLink>
    </nav>
  );
}
