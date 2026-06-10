import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full h-10 px-4 rounded-2xl text-neutral-900 placeholder:text-neutral-400/80',
        'glass-input',
        'focus:ring-0 outline-none',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
