import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../../shared/api/rooms.hooks';
import { useAuth } from '../../shared/store/useAuth';
import { MembersPanel } from './MembersPanel';
import { ChatPanel } from './ChatPanel';
import { PollsPanel } from './PollsPanel';

export function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: room, isLoading, isError } = useRoom(id ?? '');

  if (isLoading) {
    return (
      <div className="h-screen bg-forest-50 flex items-center justify-center">
        <p className="font-display text-xl text-forest-900 animate-pulse">Завантаження кімнати…</p>
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="h-screen bg-forest-50 flex flex-col items-center justify-center gap-4 px-6">
        <p className="font-body text-forest-700">Кімнату не знайдено або немає доступу.</p>
        <button
          onClick={() => navigate('/rooms')}
          className="bg-forest-600 hover:bg-forest-700 text-white font-semibold px-5 py-2.5 rounded-xl transition"
        >
          ← До моїх кімнат
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-forest-50">
      {/* Верхній хедер */}
      <header className="bg-white border-b border-forest-100 shrink-0">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/rooms')}
              className="text-forest-600 hover:text-forest-900 font-body text-sm font-medium"
            >
              ← Кімнати
            </button>
            <span className="font-display text-lg font-bold text-forest-900">
              Camp<span className="text-ember-500">Flow</span>
            </span>
          </div>
          <span className="font-body text-sm text-forest-700">{user?.fullName}</span>
        </div>
      </header>

      {/* Трипанельний layout 20 / 60 / 20 */}
      <div className="flex-1 grid grid-cols-[20%_60%_20%] overflow-hidden">
        <MembersPanel members={room.members} currentUserId={user?.id ?? ''} />
        <ChatPanel roomName={room.name} />
        <PollsPanel />
      </div>
    </div>
  );
}
