import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DesktopNav } from './DesktopNav';
import { MobileTabBar } from './MobileTabBar';
import { CreateRoomModal } from '../pages/rooms/CreateRoomModal';
import { JoinRoomModal } from '../pages/rooms/JoinRoomModal';

const pageVariants = {
  initial: { opacity: 0, scale: 0.98, filter: 'blur(3px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 1.01, filter: 'blur(2px)' },
};
const pageSpring = { type: 'spring' as const, stiffness: 380, damping: 30 };

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  return (
    <div className="flex h-[100dvh] bg-neutral-50 overflow-hidden">
      <DesktopNav
        onCreateRoom={() => { setShowJoin(false); setShowCreate(true); }}
        onJoinRoom={() => { setShowCreate(false); setShowJoin(true); }}
      />
      <main className="flex-1 min-w-0 overflow-hidden pb-14 md:pb-0 relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageSpring}
            className="h-full"
          >
            <Outlet />
          </motion.div>
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
