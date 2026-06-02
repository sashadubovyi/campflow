import { type HTMLAttributes } from 'react';
import { cn } from './cn';

interface Props extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const pad = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' } as const;

export function Card({ padding = 'md', className, ...props }: Props) {
  return (
    <div className={cn('bg-white rounded-card shadow-card', pad[padding], className)} {...props} />
  );
}
