import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DesktopNav } from './DesktopNav';
import { MobileTabBar } from './MobileTabBar';
import { CreateRoomModal } from '../pages/rooms/CreateRoomModal';

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] as const },
};

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex h-[100dvh] bg-neutral-50 overflow-hidden">
      <DesktopNav onCreateRoom={() => setShowCreate(true)} />
      <main className="flex-1 min-w-0 overflow-hidden pb-14 md:pb-0 relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            {...pageTransition}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
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
