import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';
import { useRoomChat } from '../../shared/api/useRoomChat';
import { useAuth } from '../../shared/store/useAuth';
import { Avatar } from '../../shared/ui/Avatar';
import type { Message } from '../../shared/api/chat.api';

interface Props {
  roomId: string;
  roomName: string;
}

function formatTime(iso: string, locale: string): string {
  const localeMap: Record<string, string> = { uk: 'uk-UA', en: 'en-US', ru: 'ru-RU' };
  return new Date(iso).toLocaleTimeString(localeMap[locale] ?? 'uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChatPanel({ roomId, roomName }: Props) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { messages, isLoading, typingUsers, sendMessage, emitTyping } = useRoomChat(roomId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    emitTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(false), 1500);
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setText('');
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
    <section className="h-full flex flex-col bg-neutral-50 min-h-0">
      {/* Заголовок — лише на десктопі (на мобайлі назва в хедері RoomPage) */}
      <div className="hidden md:block px-6 py-4 border-b border-neutral-100 bg-white shrink-0">
        <h2 className="text-lg font-bold text-neutral-900">{roomName}</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-6 py-4 space-y-3">
        {isLoading && (
          <p className="text-center text-neutral-400 text-sm animate-pulse">
            {t('common.loading')}
          </p>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-neutral-400">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm">{t('chat.noMessages')}</p>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isOwn={m.authorId === user?.id}
            locale={i18n.language}
          />
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="h-5 px-4 md:px-6 shrink-0">
        {othersTyping.length > 0 && (
          <p className="text-xs text-neutral-400 animate-pulse">
            {othersTyping.length === 1 ? t('chat.typing', { name: '…' }) : t('chat.typingMultiple')}
          </p>
        )}
      </div>

      <div className="px-4 md:px-6 py-3 border-t border-neutral-100 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            className="flex-1 h-11 px-4 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-40 disabled:hover:bg-accent-500 transition"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

function MessageBubble({
  message,
  isOwn,
  locale,
}: {
  message: Message;
  isOwn: boolean;
  locale: string;
}) {
  if (message.type === 'system') {
    return (
      <div className="flex justify-center">
        <p className="text-xs text-neutral-500 bg-neutral-100 rounded-full px-3 py-1">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (
        <Avatar
          fullName={message.author?.fullName ?? '?'}
          avatarUrl={message.author?.avatarUrl}
          size={32}
        />
      )}
      <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-baseline gap-2 px-1">
          {!isOwn && (
            <span className="text-xs font-medium text-neutral-700">{message.author?.fullName}</span>
          )}
          <span className="text-[10px] text-neutral-400">
            {formatTime(message.createdAt, locale)}
          </span>
        </div>
        <div
          className={`mt-0.5 px-3.5 py-2 text-sm leading-relaxed ${
            isOwn
              ? 'bg-accent-500 text-white rounded-2xl rounded-tr-md'
              : 'bg-white text-neutral-900 shadow-card rounded-2xl rounded-tl-md'
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
