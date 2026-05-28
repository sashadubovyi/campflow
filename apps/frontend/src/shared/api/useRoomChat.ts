import { useCallback, useEffect, useState } from 'react';
import { chatApi, type Message } from './chat.api';
import { getSocket } from '../socket/socket';

export function useRoomChat(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);

  // Завантаження історії
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

  // Підключення до socket + підписки
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

    if (socket.connected) {
      onConnect();
    }
    socket.on('connect', onConnect);
    socket.on('message:new', onNewMessage);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.emit('room:leave', { roomId });
      socket.off('connect', onConnect);
      socket.off('message:new', onNewMessage);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [roomId]);

  const sendMessage = useCallback(
    (content: string) => {
      const socket = getSocket();
      socket.emit('message:send', { roomId, content });
    },
    [roomId],
  );

  const emitTyping = useCallback(
    (typing: boolean) => {
      const socket = getSocket();
      socket.emit(typing ? 'typing:start' : 'typing:stop', { roomId });
    },
    [roomId],
  );

  return { messages, isLoading, typingUsers, connected, sendMessage, emitTyping };
}
