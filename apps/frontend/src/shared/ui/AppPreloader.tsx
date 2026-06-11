import { useState, useEffect, type ReactNode } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useAuthStore } from '../store/auth.store';
import { Skeleton } from './Skeleton';

// ─── Constants ────────────────────────────────────────────────────────────────

const ANIM_MIN_MS = 1500; // minimum time the preloader plays (one full pulse cycle)

// ─── Phase machine ────────────────────────────────────────────────────────────
//
//  isAnimationPlaying  │  isDataLoading  │  Phase
//  ────────────────────┼─────────────────┼────────────
//       true           │    any          │  preloader   ← animation MUST finish first
//       false          │    true         │  skeleton    ← waiting for bootstrap
//       false          │    false        │  content     ← everything ready

type Phase = 'preloader' | 'skeleton' | 'content';

function derivePhase(isAnimationPlaying: boolean, isDataLoading: boolean): Phase {
  if (isAnimationPlaying) return 'preloader';
  if (isDataLoading) return 'skeleton';
  return 'content';
}

// ─── Framer variants (reused for enter/exit) ──────────────────────────────────

const overlayVariants = {
  initial: { opacity: 1 },
  exit: {
    opacity: 0,
    scale: 1.06,
    filter: 'blur(14px)',
    transition: { duration: 0.42, ease: [0.22, 0, 0, 1] as const },
  },
};

const skeletonVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.26, ease: 'easeOut' as const } },
  exit:    { opacity: 0, transition: { duration: 0.22, ease: 'easeIn'  as const } },
};

const contentVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.32, ease: 'easeOut' as const } },
};

// ─── Splash screen (preloader phase) ──────────────────────────────────────────

function PreloaderScreen() {
  return (
    <div
      role="status"
      aria-label="Завантаження &u"
      className="w-full h-full flex flex-col items-center justify-center gap-7"
      style={{
        backgroundColor: '#dce3f0',
        backgroundImage: [
          'radial-gradient(ellipse 900px 700px at 10% 15%, rgba(99,102,241,0.11) 0%, transparent 60%)',
          'radial-gradient(ellipse 700px 600px at 88% 10%, rgba(45,111,248,0.09) 0%, transparent 55%)',
          'radial-gradient(ellipse 600px 800px at 60% 90%, rgba(139,92,246,0.08) 0%, transparent 55%)',
          'radial-gradient(ellipse 800px 500px at  5% 75%, rgba(20,184,166,0.06) 0%, transparent 50%)',
        ].join(','),
      }}
    >
      {/* Animated brand glyph */}
      <span
        aria-hidden
        className="font-display font-bold leading-none select-none
                   bg-clip-text text-transparent bg-brand-gradient
                   animate-brand-pulse"
        style={{ fontSize: 'clamp(6rem, 18vw, 11rem)' }}
      >
        &amp;
      </span>

      {/* Staggered bounce dots */}
      <div className="flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[7px] h-[7px] rounded-full bg-accent-400/70 animate-bounce"
            style={{ animationDelay: `${i * 0.17}s`, animationDuration: '0.88s' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton screen (animation done, data still loading) ─────────────────────

function SkeletonScreen() {
  return (
    <div
      aria-busy="true"
      aria-label="Завантаження даних"
      className="w-full h-full"
      style={{
        backgroundColor: '#dce3f0',
        backgroundImage: [
          'radial-gradient(ellipse 900px 700px at 10% 15%, rgba(99,102,241,0.11) 0%, transparent 60%)',
          'radial-gradient(ellipse 700px 600px at 88% 10%, rgba(45,111,248,0.09) 0%, transparent 55%)',
          'radial-gradient(ellipse 600px 800px at 60% 90%, rgba(139,92,246,0.08) 0%, transparent 55%)',
          'radial-gradient(ellipse 800px 500px at  5% 75%, rgba(20,184,166,0.06) 0%, transparent 50%)',
        ].join(','),
      }}
    >
      {/* Fake glass header */}
      <div className="h-12 glass-header shadow-[0_0.5px_0_rgba(0,0,0,0.06)]" />

      {/* Fake content cards */}
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-5 space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="glass-card p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Gate component ───────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
}

/**
 * Strict loading pipeline — main content is NEVER mounted in the DOM
 * until the animation has officially finished.
 *
 * Timeline:
 *   isAnimationPlaying=true  → ONLY <PreloaderScreen> rendered
 *   isAnimationPlaying=false, isDataLoading=true  → ONLY <SkeletonScreen>
 *   isAnimationPlaying=false, isDataLoading=false → children with fade-in
 *
 * AnimatePresence mode="wait" ensures each phase's exit animation
 * completes before the next phase mounts — no overlap, no pop-in.
 */
export function AppPreloader({ children }: Props) {
  // ── State 1: animation timer ──────────────────────────────────────────────
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(true);

  // ── State 2: data loading (auth bootstrap) ────────────────────────────────
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Start the minimum-duration timer
  useEffect(() => {
    const t = setTimeout(() => setIsAnimationPlaying(false), ANIM_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  // Mirror isInitialized into isDataLoading (once true, stays false)
  useEffect(() => {
    if (isInitialized) setIsDataLoading(false);
  }, [isInitialized]);

  const phase = derivePhase(isAnimationPlaying, isDataLoading);

  // ── AnimatePresence mode="wait":
  //    exit animation of the leaving phase completes BEFORE the entering
  //    phase mounts — strict DOM isolation between phases.
  return (
    <AnimatePresence mode="wait" initial={false}>

      {phase === 'preloader' && (
        <m.div
          key="preloader"
          variants={overlayVariants}
          initial="initial"
          exit="exit"
          className="fixed inset-0 z-[200]"
        >
          <PreloaderScreen />
        </m.div>
      )}

      {phase === 'skeleton' && (
        <m.div
          key="skeleton"
          variants={skeletonVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-[200]"
        >
          <SkeletonScreen />
        </m.div>
      )}

      {phase === 'content' && (
        <m.div
          key="content"
          variants={contentVariants}
          initial="initial"
          animate="animate"
          // No exit — once content is shown it stays
        >
          {children}
        </m.div>
      )}

    </AnimatePresence>
  );
}
