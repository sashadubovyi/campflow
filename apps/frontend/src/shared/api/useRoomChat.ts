import { useCallback, useEffect, useState } from 'react';
import { chatApi, type Message } from './chat.api';
import { getSocket } from '../socket/socket';
import { useAuth } from '../store/useAuth';

export function useRoomChat(roomId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    chatApi
      .history(roomId)
      .then((page) => {
        if (!cancelled) setMessages(page.items);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      setConnected(true);
      socket.emit('room:join', { roomId });
    }

    function onNewMessage(msg: Message) {
      if (msg.roomId !== roomId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }

    function onMessageDeleted({ messageId }: { messageId: string }) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }

    function onMessageUpdated(msg: Message) {
      if (msg.roomId !== roomId) return;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
    }

    function onTypingStart(e: { userId: string }) {
      setTypingUsers((prev) => new Set(prev).add(e.userId));
    }

    function onTypingStop(e: { userId: string }) {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(e.userId);
        return next;
      });
    }

    if (socket.connected) onConnect();
    socket.on('connect', onConnect);
    socket.on('message:new', onNewMessage);
    socket.on('message:deleted', onMessageDeleted);
    socket.on('message:updated', onMessageUpdated);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.emit('room:leave', { roomId });
      socket.off('connect', onConnect);
      socket.off('message:new', onNewMessage);
      socket.off('message:deleted', onMessageDeleted);
      socket.off('message:updated', onMessageUpdated);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [roomId]);

  const sendMessage = useCallback(
    (content: string, retryId?: string, replyTo?: { id: string; content: string; authorId: string | null; author: { id: string; fullName: string } | null } | null): string => {
      const socket = getSocket();
      const tempId = retryId ?? `pending-${Date.now()}-${Math.random()}`;

      if (!retryId) {
        const optimistic: Message = {
          id: tempId,
          roomId,
          authorId: user?.id ?? null,
          type: 'text',
          content,
          isImportant: false,
          createdAt: new Date().toISOString(),
          author: user
            ? { id: user.id, fullName: user.fullName, avatarUrl: user.avatarUrl }
            : null,
          replyToId: replyTo?.id ?? null,
          replyTo: replyTo ?? null,
          _status: 'sending',
        };
        setMessages((prev) => [...prev, optimistic]);
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === retryId ? { ...m, _status: 'sending' as const } : m)),
        );
      }

      socket.timeout(6000).emit(
        'message:send',
        { roomId, content, replyToId: replyTo?.id },
        (err: Error | null, ack: { ok: boolean; id: string; error?: string } | undefined) => {
          if (err || !ack?.ok) {
            console.error('[WS] message:send failed', { err: err?.message, ack, connected: socket.connected });
            setMessages((prev) =>
              prev.map((m) => (m.id === tempId ? { ...m, _status: 'failed' as const } : m)),
            );
          } else {
            // Promote optimistic → confirmed with real server ID.
            // If the server also broadcasts message:new, the dedup check
            // in onNewMessage will skip the duplicate.
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempId ? { ...m, id: ack.id, _status: undefined } : m,
              ),
            );
          }
        },
      );

      return tempId;
    },
    [roomId, user],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      getSocket().emit('message:delete', { messageId, roomId });
    },
    [roomId],
  );

  const toggleImportant = useCallback(
    (messageId: string) => {
      getSocket().emit('message:toggleImportant', { messageId, roomId });
    },
    [roomId],
  );

  const emitTyping = useCallback(
    (typing: boolean) => {
      getSocket().emit(typing ? 'typing:start' : 'typing:stop', { roomId });
    },
    [roomId],
  );

  return { messages, isLoading, typingUsers, connected, sendMessage, deleteMessage, toggleImportant, emitTyping };
}
