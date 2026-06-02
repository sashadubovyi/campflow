import { type HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  neutral: 'bg-neutral-100 text-neutral-600',
  accent: 'bg-accent-50 text-accent-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
};

export function Badge({ tone = 'neutral', className, ...props }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
