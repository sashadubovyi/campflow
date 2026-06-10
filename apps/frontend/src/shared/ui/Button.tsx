import { forwardRef } from 'react';
import { m, type HTMLMotionProps } from 'framer-motion';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends HTMLMotionProps<'button'> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'btn-glass-blue',
  secondary:
    'bg-white/55 border border-white/70 text-neutral-700 backdrop-blur-md hover:bg-white/72 hover:border-white/85 hover:text-neutral-900 transition-all duration-200',
  ghost:
    'bg-transparent border border-transparent text-neutral-600 hover:bg-white/50 hover:border-white/60 hover:text-neutral-900 transition-all duration-200',
  danger:
    'bg-danger-500/12 border border-danger-500/30 text-danger-700 backdrop-blur-md hover:bg-danger-500/20 hover:border-danger-500/42 transition-all duration-200',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-xl',
  md: 'h-10 px-4 text-sm rounded-2xl',
  lg: 'h-12 px-6 text-base rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', fullWidth, className, ...props }, ref) => (
    <m.button
      ref={ref}
      whileTap={props.disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
