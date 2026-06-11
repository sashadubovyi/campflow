import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { DesktopNav } from './DesktopNav';
import { MobileTabBar } from './MobileTabBar';
import { CreateRoomModal } from '../pages/rooms/CreateRoomModal';
import { JoinRoomModal } from '../pages/rooms/JoinRoomModal';

export function AppShell() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <DesktopNav
        onCreateRoom={() => { setShowJoin(false); setShowCreate(true); }}
        onJoinRoom={() => { setShowCreate(false); setShowJoin(true); }}
      />
      <main className="flex-1 min-w-0 overflow-hidden pb-14 md:pb-0 relative">
        <Outlet />
      </main>
      <MobileTabBar />
      <AnimatePresence>
        {showCreate && (
          <CreateRoomModal
            key="create-modal"
            onClose={() => setShowCreate(false)}
            onCreated={(roomId) => {
              setShowCreate(false);
              navigate(`/rooms/${roomId}`);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showJoin && (
          <JoinRoomModal
            key="join-modal"
            onClose={() => setShowJoin(false)}
            onJoined={(id) => {
              setShowJoin(false);
              navigate(`/rooms/${id}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
