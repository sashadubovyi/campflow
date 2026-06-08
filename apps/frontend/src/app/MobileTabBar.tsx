import { NavLink } from 'react-router-dom';
import { MessageCircle, Heart, User, Ampersand } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../shared/store/useAuth';
import { cn } from '../shared/ui';

const itemCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors',
    isActive ? 'text-accent-600' : 'text-neutral-400',
  );

export function MobileTabBar() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <nav className="flex md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white border-t border-neutral-100 pb-[env(safe-area-inset-bottom)]">
      <NavLink to="/rooms" className={itemCls}>
        <Ampersand size={22} />
        <span>{t('nav.feed', '&u')}</span>
      </NavLink>
      <NavLink to="/chat" className={itemCls}>
        <MessageCircle size={22} />
        <span>{t('nav.chat')}</span>
      </NavLink>
      <NavLink to="/events" className={itemCls}>
        <Heart size={22} />
        <span>{t('nav.events')}</span>
      </NavLink>
      <NavLink to={user?.username ? `/u/${user.username}` : '/rooms'} className={itemCls}>
        <User size={22} />
        <span>{t('nav.profile')}</span>
      </NavLink>
    </nav>
  );
}
