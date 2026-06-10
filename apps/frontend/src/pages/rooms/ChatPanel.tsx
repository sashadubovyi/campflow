import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, MessageCircle, MoreHorizontal, Trash2, Star, RefreshCw, CornerUpLeft, X } from 'lucide-react';
import { useRoomChat } from '../../shared/api/useRoomChat';
import { useAuth } from '../../shared/store/useAuth';
import { Avatar } from '../../shared/ui/Avatar';
import { Skeleton } from '../../shared/ui/Skeleton';
import { useBlockedUsers } from '../../shared/api/blocks.hooks';
import type { Message } from '../../shared/api/chat.api';

interface Props {
  roomId: string;
  roomName: string;
  importantOnly?: boolean;
  onHasImportantChange?: (has: boolean) => void;
}

function formatTime(iso: string, locale: string): string {
  const localeMap: Record<string, string> = { uk: 'uk-UA', en: 'en-US', ru: 'ru-RU' };
  return new Date(iso).toLocaleTimeString(localeMap[locale] ?? 'uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChatPanel({ roomId, roomName: _roomName, importantOnly = false, onHasImportantChange }: Props) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { messages, isLoading, typingUsers, sendMessage, deleteMessage, toggleImportant, emitTyping } =
    useRoomChat(roomId);
  const { data: blockedUsers } = useBlockedUsers();
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const blockedIds = useMemo(
    () => new Set((blockedUsers ?? []).map((b) => b.user.id)),
    [blockedUsers],
  );

  function startReplyTo(m: Message) {
    setReplyingTo(m);
    // Невелика затримка — щоб мобільний клавіатурний focus спрацював після
    // закриття меню/тача.
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasImportant = messages.some((m) => m.isImportant);
  useEffect(() => {
    onHasImportantChange?.(hasImportant);
  }, [hasImportant, onHasImportantChange]);

  const visibleMessages = (importantOnly ? messages.filter((m) => m.isImportant) : messages)
    .filter((m) => m.type === 'system' || !blockedIds.has(m.authorId ?? ''));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    emitTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(false), 1500);
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const replyPayload = replyingTo
      ? {
          id: replyingTo.id,
          content: replyingTo.content,
          authorId: replyingTo.authorId,
          author: replyingTo.author
            ? { id: replyingTo.author.id, fullName: replyingTo.author.fullName }
            : null,
        }
      : null;
    sendMessage(trimmed, undefined, replyPayload);
    setText('');
    setReplyingTo(null);
    emitTyping(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const othersTyping = [...typingUsers].filter((id) => id !== user?.id);

  return (
    <section className="h-full flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-6 py-4 space-y-1">
        {isLoading && (
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex gap-2.5 items-end ${i % 3 === 2 ? 'flex-row-reverse' : ''}`}>
                {i % 3 !== 2 && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
                <Skeleton className={`h-10 rounded-2xl ${i % 3 === 2 ? 'w-[55%]' : 'w-[65%]'}`} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && visibleMessages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-neutral-400">
              <MessageCircle size={36} className="text-neutral-300 mb-2 mx-auto" />
              <p className="text-sm">
                {importantOnly ? t('chat.noImportantMessages', 'Немає важливих повідомлень') : t('chat.noMessages')}
              </p>
            </div>
          </div>
        )}

        {visibleMessages.map((m, i) => {
          const prev = visibleMessages[i - 1];
          const showAvatar =
            m.type !== 'system' &&
            m.authorId !== user?.id &&
            (prev === undefined || prev.type === 'system' || prev.authorId !== m.authorId);
          const isOwn = m.authorId === user?.id;
          return (
            <MessageBubble
              key={m.id}
              message={m}
              isOwn={isOwn}
              showAvatar={showAvatar}
              locale={i18n.language}
              onReply={() => startReplyTo(m)}
              onDelete={() => deleteMessage(m.id)}
              onToggleImportant={() => toggleImportant(m.id)}
              onRetry={() => sendMessage(m.content, m.id)}
            />
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div className="h-5 px-4 md:px-6 shrink-0">
        {othersTyping.length > 0 && (
          <p className="text-xs text-neutral-400 animate-pulse">
            {othersTyping.length === 1 ? t('chat.typing', { name: '…' }) : t('chat.typingMultiple')}
          </p>
        )}
      </div>

      <div className="border-t border-white/30 bg-white/55 backdrop-blur-xl shrink-0">
        {/* Reply preview bar — mobile-first, тонкий і клікабельний дозакриття */}
        {replyingTo && (
          <div className="flex items-center gap-2 px-3 md:px-6 py-2 bg-accent-500/8 border-b border-accent-500/20">
            <CornerUpLeft size={14} className="text-accent-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-accent-700 leading-tight">
                {t('chat.replyingTo', 'Відповідь:')}{' '}
                {replyingTo.author?.fullName ?? t('common.you', 'Ви')}
              </p>
              <p className="text-xs text-neutral-700 truncate leading-tight">
                {replyingTo.content}
              </p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="shrink-0 p-1 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-white/70 transition"
              aria-label={t('common.cancel')}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 px-4 md:px-6 py-3">
          <input
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            className="flex-1 h-11 px-4 rounded-2xl glass-input text-neutral-900 placeholder:text-neutral-400 focus:ring-0 outline-none transition"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl btn-glass-blue"
            aria-label={t('chat.send') ?? 'Send'}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

const SWIPE_REPLY_THRESHOLD = 55;

function MessageBubble({
  message,
  isOwn,
  showAvatar,
  locale,
  onReply,
  onDelete,
  onToggleImportant,
  onRetry,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  locale: string;
  onReply: () => void;
  onDelete: () => void;
  onToggleImportant: () => void;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [openDown, setOpenDown] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const touchOrigin = useRef<{ x: number; y: number } | null>(null);
  const gestureMode = useRef<'idle' | 'swipe' | 'longpress' | 'scroll'>('idle');

  function startLongPress() {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      if (gestureMode.current !== 'swipe' && gestureMode.current !== 'scroll') {
        longPressTriggered.current = true;
        gestureMode.current = 'longpress';
        setOpenDown(false);
        setMenuOpen(true);
        try { navigator.vibrate?.(15); } catch { /* ignore */ }
      }
    }, 550);
  }

  function cancelLongPress() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (message.type === 'system') return;
    const touch = e.touches[0];
    if (!touch) return;
    touchOrigin.current = { x: touch.clientX, y: touch.clientY };
    gestureMode.current = 'idle';
    startLongPress();
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!touch || !touchOrigin.current) return;
    const dx = touch.clientX - touchOrigin.current.x;
    const adx = Math.abs(dx);
    const ady = Math.abs(touch.clientY - touchOrigin.current.y);

    if (gestureMode.current === 'idle' && (adx > 5 || ady > 5)) {
      if (adx > ady && dx < 0) {
        gestureMode.current = 'swipe';
        cancelLongPress();
      } else {
        gestureMode.current = 'scroll';
        cancelLongPress();
      }
    }

    if (gestureMode.current === 'swipe' && dx < 0) {
      setSwipeX(Math.min(-dx, 70));
    }
  }

  function handleTouchEnd() {
    cancelLongPress();
    if (gestureMode.current === 'swipe' && swipeX >= SWIPE_REPLY_THRESHOLD) {
      onReply();
      try { navigator.vibrate?.(15); } catch { /* ignore */ }
    }
    setSwipeX(0);
    gestureMode.current = 'idle';
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setDeleteConfirm(false);
      }
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
    setDeleteConfirm(false);
  }

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <p className="text-xs text-neutral-500 bg-white/40 backdrop-blur-sm rounded-full px-3 py-1">
          {message.content}
        </p>
      </div>
    );
  }

  const isFailed = message._status === 'failed';
  const isSending = message._status === 'sending';
  const replyIconOpacity = swipeX > 15 ? Math.min((swipeX - 15) / 30, 1) : 0;

  const bubbleInner = (
    <div
      className={`px-3.5 py-2 text-sm leading-relaxed select-none ${isSending || isFailed ? 'opacity-50' : ''} ${
        isOwn
          ? 'bg-gradient-to-br from-accent-400 to-accent-600 text-white rounded-2xl rounded-tr-md shadow-sm'
          : 'glass-card !rounded-2xl !rounded-tl-md text-neutral-900'
      }`}
    >
      {message.replyTo && (
        <div className={`mb-1.5 px-2 py-1 rounded-md border-l-2 text-[11px] leading-tight ${
          isOwn ? 'bg-white/10 border-white/60 text-white/90' : 'bg-white/20 border-accent-400 text-neutral-600'
        }`}>
          <p className={`font-semibold truncate ${isOwn ? 'text-white' : 'text-accent-700'}`}>
            {message.replyTo.author?.fullName ?? t('common.you', 'Ви')}
          </p>
          <p className="truncate opacity-80">{message.replyTo.content}</p>
        </div>
      )}
      {message.content}
    </div>
  );

  return (
    <div
      className={`flex gap-2.5 group items-end ${isOwn ? 'flex-row-reverse' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={(e) => { if (longPressTriggered.current) e.preventDefault(); }}
    >
      {!isOwn && (showAvatar
        ? <Avatar fullName={message.author?.fullName ?? '?'} avatarUrl={message.author?.avatarUrl} size={32} />
        : <div className="shrink-0" style={{ width: 32 }} />
      )}

      <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {showAvatar && !isOwn && (
          <div className="flex items-baseline gap-2 px-1 mb-0.5">
            <span className="text-xs font-medium text-neutral-700">{message.author?.fullName}</span>
            <span className="text-[10px] text-neutral-400">{formatTime(message.createdAt, locale)}</span>
          </div>
        )}
        {!showAvatar && !isOwn && (
          <div className="px-1 mb-0.5"><span className="text-[10px] text-neutral-400">{formatTime(message.createdAt, locale)}</span></div>
        )}
        {isOwn && (
          <div className="px-1 mb-0.5"><span className="text-[10px] text-neutral-400">{formatTime(message.createdAt, locale)}</span></div>
        )}

        {/* Bubble + reply icon layer */}
        <div className="relative flex items-center">
          {/* Reply icon — appears behind the bubble when swiping left */}
          <div
            className="absolute pointer-events-none"
            style={{
              [isOwn ? 'right' : 'left']: '100%',
              opacity: replyIconOpacity,
              transform: `translateX(${isOwn ? '' : '-'}${Math.min(swipeX * 0.4, 16)}px)`,
              transition: swipeX === 0 ? 'opacity 0.15s' : 'none',
            }}
          >
            <CornerUpLeft
              size={18}
              className={swipeX >= SWIPE_REPLY_THRESHOLD ? 'text-accent-600' : 'text-neutral-400'}
            />
          </div>

          {/* Bubble with swipe transform */}
          <div
            style={{
              transform: `translateX(-${swipeX}px)`,
              transition: swipeX === 0 ? 'transform 0.2s ease' : 'none',
            }}
          >
            {message.isImportant ? (
              <div className={`p-[1.5px] bg-gradient-to-br from-accent-400 via-violet-500 to-amber-400 animate-pulse ${isOwn ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tl-md'}`}>
                {bubbleInner}
              </div>
            ) : (
              bubbleInner
            )}
          </div>
        </div>

        {isFailed && (
          <button onClick={onRetry} className="mt-1 flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
            <RefreshCw size={12} /><span>{t('chat.retry') ?? 'Retry'}</span>
          </button>
        )}
      </div>

      {/* Three-dot menu: desktop — hover; mobile — long-press */}
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
          <div className={`absolute ${openDown ? 'top-8' : 'bottom-8'} ${isOwn ? 'right-0' : 'left-0'} glass-surface rounded-2xl py-1 z-20 min-w-[160px]`}>
            {/* Reply — desktop only, mobile uses swipe */}
            <button
              onClick={() => { onReply(); setMenuOpen(false); }}
              className="hidden md:flex w-full items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-white/50 transition-colors"
            >
              <CornerUpLeft size={14} className="text-neutral-400" />
              {t('chat.reply', 'Відповісти')}
            </button>

            <button
              onClick={() => { onToggleImportant(); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-white/50 transition-colors"
            >
              <Star size={14} className={message.isImportant ? 'text-amber-400 fill-amber-400' : 'text-neutral-400'} />
              {message.isImportant ? (t('chat.unmarkImportant') ?? 'Unmark important') : (t('chat.markImportant') ?? 'Mark important')}
            </button>

            {isOwn && (
              <>
                <div className="mx-3 my-1 border-t border-neutral-100" />
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />{t('chat.delete') ?? 'Delete'}
                  </button>
                ) : (
                  <div className="px-3 py-2">
                    <p className="text-xs text-neutral-500 mb-2">{t('chat.deleteConfirm') ?? 'Delete this message?'}</p>
                    <div className="flex gap-2">
                      <button onClick={() => { onDelete(); setMenuOpen(false); setDeleteConfirm(false); }}
                        className="flex-1 text-xs bg-red-500 text-white rounded-lg py-1 hover:bg-red-600 transition-colors">
                        {t('common.yes') ?? 'Yes'}
                      </button>
                      <button onClick={() => setDeleteConfirm(false)}
                        className="flex-1 text-xs bg-white/55 border border-white/70 text-neutral-600 rounded-lg py-1 hover:bg-white/72 transition-colors">
                        {t('common.no') ?? 'No'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
