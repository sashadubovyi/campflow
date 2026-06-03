import type { RoomListItem } from '../../shared/api/rooms.api';
import { RoomCard } from './RoomCard';

interface RoomsListProps {
  rooms: RoomListItem[];
  onOpen: (id: string) => void;
}

export function RoomsList({ rooms, onOpen }: RoomsListProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onOpen={onOpen} />
      ))}
    </div>
  );
}
