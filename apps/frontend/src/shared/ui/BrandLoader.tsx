import { cn } from './cn';

interface Props {
  fullscreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: 'text-6xl',
  md: 'text-8xl',
  lg: 'text-[10rem] md:text-[12rem]',
} as const;

export function BrandLoader({ fullscreen, size = 'lg', label, className }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-4 text-neutral-900',
        fullscreen && 'fixed inset-0 z-[100] bg-neutral-50/80 backdrop-blur-2xl',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'font-display font-bold leading-none animate-brand-pulse',
          'bg-clip-text text-transparent bg-brand-gradient',
          SIZE_MAP[size],
        )}
      >
        &amp;
      </span>
      {label && <p className="text-sm text-neutral-500 animate-pulse">{label}</p>}
      {!label && <span className="sr-only">Loading…</span>}
    </div>
  );
}
