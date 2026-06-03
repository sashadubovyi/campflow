import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';

interface Props {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  children: ReactNode;
  topOffset?: number;
  bottomOffset?: number;
}

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
    <>
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-x-0 z-40 bg-neutral-900/40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        style={{ top: topOffset, bottom: bottomOffset }}
      />
      <div
        className={cn(
          'fixed z-50 w-[82%] max-w-[360px] bg-white shadow-card-lg flex flex-col transition-transform duration-300 ease-out',
          side === 'left' ? 'left-0' : 'right-0',
          open ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full',
        )}
        style={{ top: topOffset, bottom: bottomOffset }}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
