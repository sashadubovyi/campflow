import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { DesktopNav } from './DesktopNav';
import { MobileTabBar } from './MobileTabBar';
import { CreateRoomModal } from '../pages/rooms/CreateRoomModal';
import { JoinRoomModal } from '../pages/rooms/JoinRoomModal';

const enterTransition = { duration: 0.28, ease: 'easeOut' } as const;
const exitTransition  = { duration: 0.15, ease: 'easeIn'  } as const;

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <DesktopNav
        onCreateRoom={() => { setShowJoin(false); setShowCreate(true); }}
        onJoinRoom={() => { setShowCreate(false); setShowJoin(true); }}
      />
      <main className="flex-1 min-w-0 overflow-hidden pb-14 md:pb-0 relative">
        <AnimatePresence mode="wait">
          <m.div
            key={location.pathname}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)', transition: enterTransition }}
            exit={{ opacity: 0, filter: 'blur(10px)', transition: exitTransition }}
            className="h-full"
            style={{ willChange: 'filter, opacity' }}
          >
            <Outlet />
          </m.div>
        </AnimatePresence>
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
