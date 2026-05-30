import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    <section className="h-full flex flex-col bg-forest-50">
      <div className="px-6 py-4 border-b border-forest-100 bg-white shrink-0">
        <h2 className="font-display text-lg font-bold text-forest-900">{roomName}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {isLoading && (
          <p className="text-center text-forest-500 font-body text-sm animate-pulse">
            {t('common.loading')}
          </p>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-forest-500 font-body">
              <p className="text-2xl mb-2">💬</p>
              <p>{t('chat.noMessages')}</p>
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

      <div className="h-5 px-6 shrink-0">
        {othersTyping.length > 0 && (
          <p className="font-body text-xs text-forest-500 animate-pulse">
            {othersTyping.length === 1 ? t('chat.typing', { name: '…' }) : t('chat.typingMultiple')}
          </p>
        )}
      </div>

      <div className="px-6 py-4 border-t border-forest-100 bg-white shrink-0">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            className="flex-1 px-4 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition font-body"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="bg-forest-600 hover:bg-forest-700 disabled:opacity-40 text-white font-semibold px-5 rounded-xl transition"
          >
            ➤
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
        <p className="font-body text-xs text-forest-500 bg-forest-100/60 rounded-full px-3 py-1">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar
        fullName={message.author?.fullName ?? '?'}
        avatarUrl={message.author?.avatarUrl}
        size={32}
      />
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-baseline gap-2">
          {!isOwn && (
            <span className="font-body text-xs font-medium text-forest-700">
              {message.author?.fullName}
            </span>
          )}
          <span className="font-body text-[10px] text-forest-500">
            {formatTime(message.createdAt, locale)}
          </span>
        </div>
        <div
          className={`mt-0.5 px-3.5 py-2 rounded-2xl font-body text-sm ${
            isOwn
              ? 'bg-forest-600 text-white rounded-tr-sm'
              : 'bg-white text-forest-900 border border-forest-100 rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
