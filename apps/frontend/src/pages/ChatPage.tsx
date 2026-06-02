import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { useRooms } from '../shared/api/rooms.hooks';
import { ChatPanel } from './rooms/ChatPanel';

export function ChatPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: rooms, isLoading } = useRooms();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-400 animate-pulse">
        {t('common.loading')}
      </div>
    );
  }

  const room = rooms?.[0];
  if (!room) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-400 px-6 text-center">
        <MessageCircle size={48} strokeWidth={1.5} />
        <p className="text-neutral-600">{t('chat.noRoom')}</p>
        <button onClick={() => navigate('/rooms')} className="text-accent-600 font-medium text-sm">
          {t('nav.home')}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ChatPanel roomId={room.id} roomName={room.name} />
    </div>
  );
}
