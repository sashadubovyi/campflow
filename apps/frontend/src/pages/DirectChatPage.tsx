import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Send, Reply, X, MoreHorizontal, Star, Trash2, CornerUpLeft } from 'lucide-react';
import { useDmGetOrCreate, useDmMessages, useSendDm } from '../shared/api/dm.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { BackButton } from '../shared/ui';
import { UserProfileModal } from '../shared/ui/UserProfileModal';
import { isTouchDevice } from '../shared/lib/isTouchDevice';

function formatTime(iso: string, locale: string): string {
  const map: Record<string, string> = { uk: 'uk-UA', en: 'en-US', ru: 'ru-RU' };
  return new Date(iso).toLocaleTimeString(map[locale] ?? 'uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

type DmMessage = {
  id: string;
  content: string;
  isOwn: boolean;
  createdAt: string;
  senderName?: string;
};

const SWIPE_REPLY_THRESHOLD = 55;
const LONG_PRESS_MS = 550;

function DmMessageBubble({
  message,
  locale,
  onReply,
}: {
  message: DmMessage;
  locale: string;
  onReply: (msg: DmMessage) => void;
}) {
  const { t } = useTranslation();
  const [swipeX, setSwipeX] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDown, setOpenDown] = useState(false);
  const menuRef    = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const touchOrigin    = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const gestureMode = useRef<'idle' | 'swipe' | 'scroll' | 'longpress'>('idle');
  const triggered   = useRef(false);

  function cancelLongPress() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }

  function onTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    touchOrigin.current = { x: touch.clientX, y: touch.clientY };
    gestureMode.current = 'idle';
    longPressTriggered.current = false;
    triggered.current = false;

    longPressTimer.current = setTimeout(() => {
      if (gestureMode.current === 'idle') {
        gestureMode.current = 'longpress';
        longPressTriggered.current = true;
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setOpenDown(rect.top < 120);
        }
        setMenuOpen(true);
        try { navigator.vibrate?.(15); } catch { /* ignore */ }
      }
    }, LONG_PRESS_MS);
  }

  function onTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - touchOrigin.current.x;
    const dy = Math.abs(touch.clientY - touchOrigin.current.y);

    if (gestureMode.current === 'idle' && (Math.abs(dx) > 6 || dy > 6)) {
      cancelLongPress();
      // Right swipe → reply
      if (Math.abs(dx) > dy && dx > 0) {
        gestureMode.current = 'swipe';
      } else {
        gestureMode.current = 'scroll';
      }
    }

    if (gestureMode.current === 'swipe' && dx > 0) {
      const raw = Math.min(dx, SWIPE_REPLY_THRESHOLD + 20);
      setSwipeX(raw);
      if (raw >= SWIPE_REPLY_THRESHOLD && !triggered.current) {
        triggered.current = true;
        try { navigator.vibrate?.(30); } catch { /* ignore */ }
      }
    }
  }

  function onTouchEnd() {
    cancelLongPress();
    if (gestureMode.current === 'swipe' && swipeX >= SWIPE_REPLY_THRESHOLD) {
      onReply(message);
    }
    setSwipeX(0);
    gestureMode.current = 'idle';
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  function handleToggleMenu() {
    if (!menuOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setOpenDown(rect.top < 120);
    }
    setMenuOpen((v) => !v);
  }

  const progress = Math.min(swipeX / SWIPE_REPLY_THRESHOLD, 1);
  const replyIconColor = swipeX >= SWIPE_REPLY_THRESHOLD ? '#3b82f6' : '#9ca3af';

  return (
    <div
      className={`flex gap-2.5 group items-end ${message.isOwn ? 'flex-row-reverse' : ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onContextMenu={(e) => { if (longPressTriggered.current) e.preventDefault(); }}
    >
      {/* Reply icon + swipeable bubble */}
      <div className="relative flex items-center">
        {/* Reply icon: left of own bubbles, right of others' */}
        <div
          className="absolute pointer-events-none"
          style={{
            [message.isOwn ? 'right' : 'left']: '100%',
            opacity: progress,
            transition: swipeX === 0 ? 'opacity 0.15s' : 'none',
            pointerEvents: 'none',
          }}
        >
          <Reply size={18} color={replyIconColor} />
        </div>

        {/* Bubble slides RIGHT on right swipe */}
        <div
          style={{
            transform: `translateX(${swipeX}px)`,
            transition: swipeX === 0 ? 'transform 0.22s cubic-bezier(0.2,0,0,1)' : 'none',
            touchAction: 'pan-y',
          }}
          className={`max-w-[75%] px-3.5 py-2 text-sm rounded-2xl shadow-sm ${
            message.isOwn
              ? 'bg-gradient-to-br from-accent-400 to-accent-600 text-white rounded-tr-md'
              : 'bg-white/75 backdrop-blur-sm text-neutral-900 rounded-tl-md'
          }`}
        >
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <p className={`text-[10px] mt-0.5 text-right ${message.isOwn ? 'text-white/70' : 'text-neutral-400'}`}>
            {formatTime(message.createdAt, locale)}
          </p>
        </div>
      </div>

      {/* Three-dot menu: desktop hover + mobile long-press */}
      <div
        ref={menuRef}
        className={`self-end mb-1 relative transition-opacity ${
          menuOpen ? 'flex opacity-100' : 'md:flex md:opacity-0 md:group-hover:opacity-100 hidden'
        }`}
      >
        <button
          ref={triggerRef}
          onClick={handleToggleMenu}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 glass-icon transition-colors"
          aria-label="Message options"
        >
          <MoreHorizontal size={15} />
        </button>

        {menuOpen && (
          <div
            className={`absolute ${openDown ? 'top-8' : 'bottom-8'} ${message.isOwn ? 'right-0' : 'left-0'} glass-surface rounded-2xl py-1 z-20 min-w-[160px]`}
          >
            <button
              onClick={() => { onReply(message); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-white/50 transition-colors"
            >
              <CornerUpLeft size={14} className="text-neutral-400" />
              {t('chat.reply', 'Відповісти')}
            </button>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-white/50 transition-colors"
            >
              <Star size={14} className="text-neutral-400" />
              {t('chat.markImportant', 'Важливо')}
            </button>
            {message.isOwn && (
              <>
                <div className="mx-3 my-1 border-t border-neutral-100" />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  {t('chat.delete', 'Видалити')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function DirectChatPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const { data: chat, isLoading, isError } = useDmGetOrCreate(username ?? '');
  const { data: messages = [] } = useDmMessages(chat?.id ?? '');
  const send = useSendDm(chat?.id ?? '');
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<DmMessage | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleReply(msg: DmMessage) {
    setReplyingTo(msg);
    inputRef.current?.focus();
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !chat) return;
    setText('');
    setReplyingTo(null);
    send.mutate(trimmed);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // Dismiss keyboard when user starts scrolling (touch only)
  function handleChatScroll() {
    if (isTouchDevice() && document.activeElement === inputRef.current) {
      inputRef.current?.blur();
    }
  }

  if (!username || isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-400 animate-pulse">
        {t('common.loading')}
      </div>
    );
  }

  if (isError || !chat) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center text-neutral-500">
        <p className="text-sm">{t('dm.notFound', 'Не вдалося відкрити чат')}</p>
        <button onClick={() => navigate('/chat')} className="text-accent-600 text-sm font-medium hover:underline">
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-body">
      <header className="glass-header shadow-[0_0.5px_0_rgba(0,0,0,0.06)] shrink-0 px-2 md:px-4 h-12 flex items-center gap-2">
        <BackButton />
        {/* Tap on peer info → open profile modal (not navigate away) */}
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2.5 flex-1 min-w-0 hover:bg-white/50 rounded-xl px-2 py-1 transition"
        >
          <Avatar
            fullName={chat.peer.fullName}
            avatarUrl={chat.peer.avatarUrl}
            size={36}
            isOnline={chat.peer.isOnline}
            showStatus
          />
          <div className="flex flex-col items-start min-w-0">
            <span className="font-display text-base font-bold text-neutral-900 truncate leading-tight">
              {chat.peer.fullName}
            </span>
            <span className="text-[10px] text-neutral-400 truncate leading-tight">
              {chat.peer.isOnline ? t('profile.online', 'онлайн') : `@${chat.peer.username}`}
            </span>
          </div>
        </button>
      </header>

      {/* Messages — scroll to dismiss keyboard on touch */}
      <div
        className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-2"
        onScroll={handleChatScroll}
      >
        {messages.length === 0 && (
          <p className="text-center text-neutral-400 text-sm pt-12">
            {t('dm.noMessages', 'Ще немає повідомлень')}
          </p>
        )}
        {messages.map((m) => (
          <DmMessageBubble key={m.id} message={m} locale={i18n.language} onReply={handleReply} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 md:px-6 py-3 border-t border-white/30 bg-white/55 backdrop-blur-xl shrink-0">
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-accent-50 rounded-xl border-l-2 border-accent-400">
            <Reply size={14} className="text-accent-500 shrink-0" />
            <p className="flex-1 text-xs text-neutral-600 truncate">{replyingTo.content}</p>
            <button onClick={() => setReplyingTo(null)} className="shrink-0 text-neutral-400 hover:text-neutral-600 transition">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t('chat.placeholder')}
            className="flex-1 h-11 px-4 rounded-2xl glass-input text-neutral-900 placeholder:text-neutral-400 focus:ring-0 outline-none transition"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || send.isPending}
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl btn-glass-blue"
            aria-label={t('chat.send') ?? 'Send'}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Profile modal — opens instead of navigating to profile page */}
      <UserProfileModal
        username={chat.peer.username}
        open={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
}
