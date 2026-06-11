import { useState, useEffect, type ReactNode } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useAuthStore } from '../store/auth.store';

// Minimum time the preloader is shown, even if data arrives instantly.
// Keeps the animation from flashing and ensures at least one full pulse cycle.
const MIN_MS = 1200;

function Splash() {
  return (
    <div
      role="status"
      aria-label="Завантаження &u"
      className="w-full h-full flex flex-col items-center justify-center gap-7"
      style={{
        backgroundColor: '#dce3f0',
        backgroundImage: `
          radial-gradient(ellipse 900px 700px at 10% 15%, rgba(99,102,241,0.11) 0%, transparent 60%),
          radial-gradient(ellipse 700px 600px at 88% 10%, rgba(45,111,248,0.09) 0%, transparent 55%),
          radial-gradient(ellipse 600px 800px at 60% 90%, rgba(139,92,246,0.08) 0%, transparent 55%),
          radial-gradient(ellipse 800px 500px at  5% 75%, rgba(20,184,166,0.06) 0%, transparent 50%)
        `,
      }}
    >
      {/* Brand logo — same as BrandLoader but fluid size */}
      <span
        aria-hidden
        className="font-display font-bold leading-none select-none
                   bg-clip-text text-transparent bg-brand-gradient
                   animate-brand-pulse"
        style={{ fontSize: 'clamp(6.5rem, 18vw, 11rem)' }}
      >
        &amp;
      </span>

      {/* Three bouncing dots — progress signal */}
      <div className="flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[7px] h-[7px] rounded-full bg-accent-400/65 animate-bounce"
            style={{ animationDelay: `${i * 0.17}s`, animationDuration: '0.88s' }}
          />
        ))}
      </div>
    </div>
  );
}

interface Props {
  children: ReactNode;
}

/**
 * Wraps the app and enforces the UX loading pipeline:
 *
 * 1. Immediately shows the animated preloader.
 * 2. Children mount in the background so React Query fires requests early.
 * 3. Overlay stays until BOTH conditions are true:
 *    a. MIN_MS has elapsed (animation looks complete)
 *    b. Auth bootstrap has finished (isInitialized)
 * 4. Overlay then fades out with a scale+blur exit.
 * 5. If data is still loading after the overlay is gone, individual
 *    pages show their own skeleton screens.
 */
export function AppPreloader({ children }: Props) {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const [minDone, setMinDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), MIN_MS);
    return () => clearTimeout(t);
  }, []);

  // Stay visible until BOTH the timer and bootstrap are done
  const showOverlay = !minDone || !isInitialized;

  return (
    <>
      {/* Always mounted — starts network requests while preloader is still visible */}
      {children}

      <AnimatePresence>
        {showOverlay && (
          <m.div
            key="app-preloader"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.06,
              filter: 'blur(18px)',
              transition: { duration: 0.44, ease: [0.22, 0, 0, 1] },
            }}
            className="fixed inset-0 z-[200]"
          >
            <Splash />
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
