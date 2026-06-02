import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, ChevronDown, ArrowUpRight } from 'lucide-react';
import { useRooms } from '../shared/api/rooms.hooks';
import { ChatPanel } from './rooms/ChatPanel';
import { cn } from '../shared/ui';

export function ChatPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: rooms, isLoading } = useRooms();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-400 animate-pulse">
        {t('common.loading')}
      </div>
    );
  }

  const room = rooms?.find((r) => r.id === selectedId) ?? rooms?.[0];
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

  const hasMany = (rooms?.length ?? 0) > 1;

  return (
    <div className="h-full flex flex-col">
      {/* Хедер лише на мобайлі (на десктопі назву показує ChatPanel) */}
      <header className="md:hidden bg-white border-b border-neutral-100 shrink-0 px-3 py-2.5 flex items-center gap-2 relative">
        <button
          onClick={() => hasMany && setPickerOpen((v) => !v)}
          className="flex items-center gap-1.5 min-w-0"
        >
          <span className="text-base font-bold text-neutral-900 truncate">{room.name}</span>
          {hasMany && (
            <ChevronDown
              size={18}
              className={cn(
                'text-neutral-400 transition-transform shrink-0',
                pickerOpen && 'rotate-180',
              )}
            />
          )}
        </button>
        <button
          onClick={() => navigate(`/rooms/${room.id}`)}
          className="ml-auto p-2 text-neutral-500 hover:text-accent-600 rounded-lg"
          title={t('chat.openRoom')}
        >
          <ArrowUpRight size={20} />
        </button>

        {pickerOpen && hasMany && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setPickerOpen(false)} />
            <ul className="absolute left-3 top-full mt-1 z-40 bg-white border border-neutral-200 rounded-xl shadow-card-lg overflow-hidden min-w-[200px] max-h-[60vh] overflow-y-auto">
              {rooms!.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => {
                      setSelectedId(r.id);
                      setPickerOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 transition truncate',
                      r.id === room.id
                        ? 'bg-neutral-50 text-neutral-900 font-semibold'
                        : 'text-neutral-700',
                    )}
                  >
                    {r.name}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </header>

      <div className="flex-1 min-h-0">
        <ChatPanel roomId={room.id} roomName={room.name} />
      </div>
    </div>
  );
}
