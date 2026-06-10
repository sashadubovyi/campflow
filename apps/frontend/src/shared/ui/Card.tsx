import { type HTMLAttributes } from 'react';
import { cn } from './cn';

interface Props extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Elevated (modal-like) glass instead of standard card glass */
  elevated?: boolean;
}

const pad = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' } as const;

export function Card({ padding = 'md', elevated = false, className, ...props }: Props) {
  return (
    <div
      className={cn(
        elevated ? 'glass-surface rounded-card-lg' : 'glass-card',
        pad[padding],
        className,
      )}
      {...props}
    />
  );
}
