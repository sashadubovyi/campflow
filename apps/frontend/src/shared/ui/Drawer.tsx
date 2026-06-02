import { type ReactNode, useEffect } from 'react';
import { cn } from './cn';

interface Props {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  children: ReactNode;
}

export function Drawer({ open, onClose, side = 'left', children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-neutral-900/40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      />
      <div
        className={cn(
          'fixed top-0 bottom-0 z-50 w-[82%] max-w-[360px] bg-white shadow-card-lg flex flex-col transition-transform duration-300 ease-out',
          side === 'left' ? 'left-0' : 'right-0',
          open ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full',
        )}
      >
        {children}
      </div>
    </>
  );
}
