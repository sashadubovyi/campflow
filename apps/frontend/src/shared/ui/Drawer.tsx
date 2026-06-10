import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  children: ReactNode;
  topOffset?: number;
  bottomOffset?: number;
}

const spring = { type: 'spring', stiffness: 380, damping: 38 } as const;

export function Drawer({
  open,
  onClose,
  side = 'left',
  children,
  topOffset = 53,
  bottomOffset = 64,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-x-0 z-40 bg-neutral-900/40"
            style={{ top: topOffset, bottom: bottomOffset }}
          />
          <motion.div
            initial={{ x: side === 'left' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'left' ? '-100%' : '100%' }}
            transition={spring}
            className={`fixed z-50 w-[82%] max-w-[360px] bg-white shadow-card-lg flex flex-col ${side === 'left' ? 'left-0' : 'right-0'}`}
            style={{ top: topOffset, bottom: bottomOffset }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
