import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Users, Trash2, Globe, EyeOff } from 'lucide-react';
import { m } from 'framer-motion';
import type { RoomListItem } from '../../shared/api/rooms.api';
import { Avatar } from '../../shared/ui';
import { getMediaUrl } from '../../shared/lib/getMediaUrl';
import { relativeTime } from '../../shared/lib/relativeTime';

interface RoomCardProps {
  room: RoomListItem;
  onOpen: (id: string) => void;
  compact?: boolean;
  onDelete?: () => void;
  onTogglePublic?: () => void;
}

const LONG_PRESS_MS = 550;

export function RoomCard({ room, onOpen, compact = false, onDelete, onTogglePublic }: RoomCardProps) {
  const { i18n, t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasMenu = !!(onDelete || onTogglePublic);

  function openMenu(x: number, y: number) {
    setMenuPos({ x, y });
    setMenuOpen(true);
    setDeleteConfirm(false);
    try { navigator.vibrate?.(15); } catch { /* ignore */ }
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (!hasMenu) return;
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (!hasMenu) return;
    const touch = e.touches[0];
    if (!touch) return;
    const x = touch.clientX;
    const y = touch.clientY;
    longPressTimer.current = setTimeout(() => openMenu(x, y), LONG_PRESS_MS);
  }

  function handleTouchEnd() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setDeleteConfirm(false);
      }
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

  return (
    <>
      <m.button
        onClick={() => { if (!menuOpen) onOpen(room.id); }}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        whileHover={{ y: -3, boxShadow: '0 0 0 0.5px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.10), 0 20px 60px rgba(0,0,0,0.09), inset 0 1px 0 rgba(255,255,255,0.92)' }}
        whileTap={{ scale: 0.983 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="text-left w-full glass-card overflow-hidden group select-none"
      >
        {/* Admin row */}
        <div className={`flex items-center gap-2.5 px-3 pt-3 pb-2 ${room.status === 'closed' ? 'bg-danger-500/8' : ''}`}>
          {room.admin ? (
            <Avatar fullName={room.admin.fullName} avatarUrl={room.admin.avatarUrl} size={32} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/50 shrink-0" />
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-neutral-900 truncate leading-tight">{room.name}</span>
            {room.admin && (
              <span className="text-xs text-neutral-400 truncate leading-tight mt-0.5">
                {room.admin.fullName}
              </span>
            )}
          </div>
        </div>

        {/* Cover image */}
        <div className={`relative w-full overflow-hidden ${compact ? 'aspect-[32/9]' : 'aspect-[16/7]'}`}>
          <img
            src={room.coverUrl ? getMediaUrl(room.coverUrl) : '/room-cover-placeholder.jpeg'}
            alt={room.name}
            className={`w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out ${room.status === 'closed' ? 'grayscale' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 pt-6 flex items-end justify-between">
            <span className="text-white/75 text-xs">{relativeTime(room.createdAt)}</span>
            <span className="flex items-center gap-1 text-white/75 text-xs">
              <Users size={11} />
              {room.memberCount}
            </span>
          </div>
        </div>
      </m.button>

      {/* Context menu portal */}
      {menuOpen && hasMenu && createPortal(
        <div
          ref={menuRef}
          className="fixed glass-surface rounded-2xl py-1.5 z-[300] min-w-[180px] shadow-glass-panel"
          style={{ top: menuPos.y + 4, left: Math.min(menuPos.x, window.innerWidth - 192) }}
        >
          {onTogglePublic && (
            <button
              onClick={() => { onTogglePublic(); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-700 hover:bg-white/50 transition-colors"
            >
              {room.isPublic ? <EyeOff size={15} className="text-neutral-400" /> : <Globe size={15} className="text-accent-500" />}
              {room.isPublic ? t('rooms.makePrivate', 'Зробити приватною') : t('rooms.makePublic', 'Зробити публічною')}
            </button>
          )}
          {onDelete && onTogglePublic && <div className="mx-3 my-1 border-t border-neutral-100" />}
          {onDelete && (
            <>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} />
                  {t('common.delete', 'Видалити')}
                </button>
              ) : (
                <div className="px-3.5 py-2">
                  <p className="text-xs text-neutral-500 mb-2">{t('rooms.deleteConfirm', 'Видалити кімнату?')}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onDelete(); setMenuOpen(false); setDeleteConfirm(false); }}
                      className="flex-1 text-xs bg-red-500 text-white rounded-lg py-1.5 hover:bg-red-600 transition-colors font-semibold"
                    >
                      {t('common.yes', 'Так')}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="flex-1 text-xs bg-white/55 border border-white/70 text-neutral-600 rounded-lg py-1.5 hover:bg-white/72 transition-colors"
                    >
                      {t('common.no', 'Ні')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
