import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Send, Reply, X } from 'lucide-react';
import { useDmGetOrCreate, useDmMessages, useSendDm } from '../shared/api/dm.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { BackButton } from '../shared/ui';

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

function DmMessageBubble({
  message,
  locale,
  onReply,
}: {
  message: DmMessage;
  locale: string;
  onReply: (msg: DmMessage) => void;
}) {
  const [swipeX, setSwipeX] = useState(0);
  const gestureMode = useRef<'idle' | 'swipe' | 'scroll'>('idle');
  const touchOrigin = useRef({ x: 0, y: 0 });
  const triggered = useRef(false);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    touchOrigin.current = { x: t.clientX, y: t.clientY };
    gestureMode.current = 'idle';
    triggered.current = false;
  }

  function onTouchMove(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    const dx = t.clientX - touchOrigin.current.x;
    const dy = Math.abs(t.clientY - touchOrigin.current.y);

    if (gestureMode.current === 'idle' && (Math.abs(dx) > 6 || dy > 6)) {
      gestureMode.current = Math.abs(dx) > dy && dx < 0 ? 'swipe' : 'scroll';
    }

    if (gestureMode.current === 'swipe' && dx < 0) {
      const raw = Math.min(-dx, SWIPE_REPLY_THRESHOLD + 20);
      setSwipeX(raw);
      if (raw >= SWIPE_REPLY_THRESHOLD && !triggered.current) {
        triggered.current = true;
        try { navigator.vibrate?.(30); } catch (_) { /* ignore */ }
      }
    }
  }

  function onTouchEnd() {
    if (gestureMode.current === 'swipe' && swipeX >= SWIPE_REPLY_THRESHOLD) {
      onReply(message);
    }
    setSwipeX(0);
    gestureMode.current = 'idle';
  }

  const progress = Math.min(swipeX / SWIPE_REPLY_THRESHOLD, 1);
  const replyIconOpacity = progress;
  const replyIconColor = swipeX >= SWIPE_REPLY_THRESHOLD ? '#3b82f6' : '#9ca3af';

  return (
    <div className="relative flex" style={{ justifyContent: message.isOwn ? 'flex-end' : 'flex-start' }}>
      {/* Reply icon behind bubble */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          right: message.isOwn ? `calc(${swipeX}px + 4px)` : undefined,
          left: message.isOwn ? undefined : `calc(${swipeX}px + 4px)`,
          opacity: replyIconOpacity,
          transition: swipeX === 0 ? 'opacity 0.15s' : 'none',
          pointerEvents: 'none',
        }}
      >
        <Reply size={18} color={replyIconColor} />
      </div>

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${-swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.2s ease' : 'none',
          touchAction: 'pan-y',
        }}
        className={`max-w-[75%] px-3.5 py-2 text-sm rounded-2xl shadow-sm ${
          message.isOwn
            ? 'bg-gradient-to-br from-accent-400 to-accent-600 text-white rounded-tr-md'
            : 'bg-white text-neutral-900 rounded-tl-md'
        }`}
      >
        <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p
          className={`text-[10px] mt-0.5 text-right ${
            message.isOwn ? 'text-white/70' : 'text-neutral-400'
          }`}
        >
          {formatTime(message.createdAt, locale)}
        </p>
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
        <button
          onClick={() => navigate('/chat')}
          className="text-accent-600 text-sm font-medium hover:underline"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-50 font-body">
      <header className="bg-white/75 backdrop-blur-xl border-b border-neutral-100/50 shrink-0 px-2 md:px-4 h-12 flex items-center gap-2">
        <BackButton />
        <button
          onClick={() => navigate(`/u/${chat.peer.username}`)}
          className="flex items-center gap-2.5 flex-1 min-w-0 hover:bg-neutral-50 rounded-xl px-2 py-1 transition"
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

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-neutral-400 text-sm pt-12">
            {t('dm.noMessages', 'Ще немає повідомлень')}
          </p>
        )}
        {messages.map((m) => (
          <DmMessageBubble
            key={m.id}
            message={m}
            locale={i18n.language}
            onReply={handleReply}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 md:px-6 py-3 border-t border-neutral-100 bg-white shrink-0">
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-accent-50 rounded-xl border-l-2 border-accent-400">
            <Reply size={14} className="text-accent-500 shrink-0" />
            <p className="flex-1 text-xs text-neutral-600 truncate">{replyingTo.content}</p>
            <button
              onClick={() => setReplyingTo(null)}
              className="shrink-0 text-neutral-400 hover:text-neutral-600 transition"
            >
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
            className="flex-1 h-11 px-4 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || send.isPending}
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-brand-gradient hover:bg-brand-gradient-hover text-white disabled:opacity-40 transition"
            aria-label={t('chat.send') ?? 'Send'}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
