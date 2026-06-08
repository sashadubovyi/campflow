import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, MessageCircle, MoreHorizontal, Trash2, Star, RefreshCw } from 'lucide-react';
import { useRoomChat } from '../../shared/api/useRoomChat';
import { useAuth } from '../../shared/store/useAuth';
import { Avatar } from '../../shared/ui/Avatar';
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
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasImportant = messages.some((m) => m.isImportant);
  useEffect(() => {
    onHasImportantChange?.(hasImportant);
  }, [hasImportant, onHasImportantChange]);

  const visibleMessages = importantOnly ? messages.filter((m) => m.isImportant) : messages;

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
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-6 py-4 space-y-1">
        {isLoading && (
          <p className="text-center text-neutral-400 text-sm animate-pulse">
            {t('common.loading')}
          </p>
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
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-brand-gradient hover:bg-brand-gradient-hover text-white disabled:opacity-40 disabled:hover:bg-brand-gradient-hover transition"
            aria-label={t('chat.send') ?? 'Send'}
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
  showAvatar,
  locale,
  onDelete,
  onToggleImportant,
  onRetry,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  locale: string;
  onDelete: () => void;
  onToggleImportant: () => void;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
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

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <p className="text-xs text-neutral-500 bg-neutral-100 rounded-full px-3 py-1">
          {message.content}
        </p>
      </div>
    );
  }

  const isFailed = message._status === 'failed';
  const isSending = message._status === 'sending';

  const bubbleContent = (
    <div
      className={`px-3.5 py-2 text-sm leading-relaxed transition-opacity ${isSending || isFailed ? 'opacity-50' : 'opacity-100'} ${
        isOwn
          ? 'bg-gradient-to-br from-accent-400 to-accent-600 text-white rounded-2xl rounded-tr-md shadow-sm'
          : 'bg-gradient-to-br from-white to-neutral-100 text-neutral-900 shadow-card rounded-2xl rounded-tl-md'
      }`}
    >
      {message.content}
    </div>
  );

  return (
    <div className={`flex gap-2.5 group items-end ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar or spacer */}
      {!isOwn &&
        (showAvatar ? (
          <Avatar
            fullName={message.author?.fullName ?? '?'}
            avatarUrl={message.author?.avatarUrl}
            size={32}
          />
        ) : (
          <div className="shrink-0" style={{ width: 32 }} />
        ))}

      {/* Bubble */}
      <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {showAvatar && !isOwn && (
          <div className="flex items-baseline gap-2 px-1 mb-0.5">
            <span className="text-xs font-medium text-neutral-700">{message.author?.fullName}</span>
            <span className="text-[10px] text-neutral-400">{formatTime(message.createdAt, locale)}</span>
          </div>
        )}
        {!showAvatar && !isOwn && (
          <div className="px-1 mb-0.5">
            <span className="text-[10px] text-neutral-400">{formatTime(message.createdAt, locale)}</span>
          </div>
        )}
        {isOwn && (
          <div className="px-1 mb-0.5">
            <span className="text-[10px] text-neutral-400">{formatTime(message.createdAt, locale)}</span>
          </div>
        )}

        {/* Important gradient border wrapper */}
        {message.isImportant ? (
          <div
            className={`p-[1.5px] bg-gradient-to-br from-accent-400 via-violet-500 to-amber-400 animate-pulse ${
              isOwn ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tl-md'
            }`}
          >
            {bubbleContent}
          </div>
        ) : (
          bubbleContent
        )}

        {/* Retry button for failed messages */}
        {isFailed && (
          <button
            onClick={onRetry}
            className="mt-1 flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            <RefreshCw size={12} />
            <span>{t('chat.retry') ?? 'Retry'}</span>
          </button>
        )}
      </div>

      {/* Three-dot hover menu — desktop only */}
      <div
        ref={menuRef}
        className={`hidden md:flex self-end mb-1 relative opacity-0 group-hover:opacity-100 transition-opacity ${
          menuOpen ? 'opacity-100' : ''
        }`}
      >
        <button
          onClick={() => {
            setMenuOpen((v) => !v);
            setDeleteConfirm(false);
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          aria-label="Message options"
        >
          <MoreHorizontal size={15} />
        </button>

        {menuOpen && (
          <div
            className={`absolute bottom-8 ${isOwn ? 'right-0' : 'left-0'} bg-white rounded-xl shadow-card border border-neutral-100 py-1 z-20 min-w-[160px]`}
          >
            {/* Mark important */}
            <button
              onClick={() => {
                onToggleImportant();
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Star size={14} className={message.isImportant ? 'text-amber-400 fill-amber-400' : 'text-neutral-400'} />
              {message.isImportant
                ? (t('chat.unmarkImportant') ?? 'Unmark important')
                : (t('chat.markImportant') ?? 'Mark important')}
            </button>

            {/* Delete — own messages only */}
            {isOwn && (
              <>
                <div className="mx-3 my-1 border-t border-neutral-100" />
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                    {t('chat.delete') ?? 'Delete'}
                  </button>
                ) : (
                  <div className="px-3 py-2">
                    <p className="text-xs text-neutral-500 mb-2">{t('chat.deleteConfirm') ?? 'Delete this message?'}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onDelete();
                          setMenuOpen(false);
                          setDeleteConfirm(false);
                        }}
                        className="flex-1 text-xs bg-red-500 text-white rounded-lg py-1 hover:bg-red-600 transition-colors"
                      >
                        {t('common.yes') ?? 'Yes'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="flex-1 text-xs bg-neutral-100 text-neutral-600 rounded-lg py-1 hover:bg-neutral-200 transition-colors"
                      >
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
