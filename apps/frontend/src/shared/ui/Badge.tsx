import { type HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  neutral: 'bg-white/55 border-white/60 text-neutral-600 backdrop-blur-sm',
  accent:  'bg-accent-500/10 border-accent-400/30 text-accent-700 backdrop-blur-sm',
  success: 'bg-success-500/10 border-success-500/25 text-success-700 backdrop-blur-sm',
  warning: 'bg-warning-500/10 border-warning-500/25 text-warning-700 backdrop-blur-sm',
  danger:  'bg-danger-500/10 border-danger-500/25 text-danger-700 backdrop-blur-sm',
};

export function Badge({ tone = 'neutral', className, ...props }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
