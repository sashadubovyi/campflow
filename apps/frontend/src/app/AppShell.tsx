import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { DesktopNav } from './DesktopNav';
import { MobileTabBar } from './MobileTabBar';
import { CreateRoomModal } from '../pages/rooms/CreateRoomModal';

export function AppShell() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex h-[100dvh] bg-neutral-50 overflow-hidden">
      <DesktopNav onCreateRoom={() => setShowCreate(true)} />
      <main className="flex-1 min-w-0 overflow-hidden pb-16 md:pb-0">
        <Outlet />
      </main>
      <MobileTabBar />
      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={(roomId) => {
            setShowCreate(false);
            navigate(`/rooms/${roomId}`);
          }}
        />
      )}
    </div>
  );
}
