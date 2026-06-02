import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full h-10 px-4 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400',
        'focus:bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
