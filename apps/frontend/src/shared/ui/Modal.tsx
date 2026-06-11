import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';
import { cn } from './cn';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
  fullHeight?: boolean;
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' } as const;

const spring      = { type: 'spring', duration: 0.15, bounce: 0.12 } as const;
const sheetSpring = { type: 'spring', duration: 0.22, bounce: 0.04 } as const;

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = true,
  fullHeight = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (fullHeight) {
    return createPortal(
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/35 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
          >
            <m.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={sheetSpring}
              className="w-full glass-surface rounded-t-3xl shadow-glass-panel flex flex-col overflow-hidden"
              style={{ height: '92dvh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-neutral-300" />
              </div>

              {title && (
                <div className="flex items-center justify-between px-6 pt-2 pb-3 shrink-0">
                  <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
                  <button onClick={onClose} className="p-1.5 glass-icon rounded-xl">
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* Content: consumer owns padding & overflow */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {children}
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>,
      document.body,
    );
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.06 }}
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center overflow-y-auto px-4 py-6 bg-neutral-900/35 backdrop-blur-sm"
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <m.div
            initial={{ opacity: 0, scale: 0.92, y: 20, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(4px)' }}
            transition={spring}
            className={cn(
              'w-full glass-surface rounded-card-lg shadow-glass-panel my-auto',
              sizes[size],
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
                <button onClick={onClose} className="p-1.5 glass-icon rounded-xl">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className={cn('px-6 pb-6', !title && 'pt-6')}>{children}</div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
