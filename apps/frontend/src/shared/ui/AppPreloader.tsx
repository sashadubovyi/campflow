import { useEffect, useState, type ReactNode } from 'react';
import { m } from 'framer-motion';
import { useAuthStore } from '../store/auth.store';
import { Skeleton } from './Skeleton';

// ─── Skeleton screen ──────────────────────────────────────────────────────────

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
      <div className="h-12 glass-header shadow-[0_0.5px_0_rgba(0,0,0,0.06)]" />
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

export function AppPreloader({ children }: Props) {
  const isInitialized = useAuthStore((s) => s.isInitialized);

  // Lock 1 — minimum display time so the skeleton always completes a full render cycle
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(true);
  // Lock 2 — true until auth bootstrap confirms the session
  const [isDataLoading, setIsDataLoading] = useState(!isInitialized);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimationPlaying(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialized) setIsDataLoading(false);
  }, [isInitialized]);

  // Phase 1: skeleton animation minimum time not elapsed yet
  if (isAnimationPlaying) {
    return (
      <div className="fixed inset-0 z-[200]">
        <SkeletonScreen />
      </div>
    );
  }

  // Phase 2: animation done, but auth session not confirmed yet → keep skeleton
  if (isDataLoading) {
    return (
      <div className="fixed inset-0 z-[200]">
        <SkeletonScreen />
      </div>
    );
  }

  // Phase 3: both locks released → fade in the app
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.1, ease: 'easeOut' } }}
    >
      {children}
    </m.div>
  );
}
