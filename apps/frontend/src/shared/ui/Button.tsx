import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends HTMLMotionProps<'button'> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-gradient text-white hover:bg-brand-gradient-hover active:bg-brand-gradient-hover',
  secondary: 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50',
  ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100',
  danger: 'bg-danger-500 text-white hover:bg-danger-700',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', fullWidth, className, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileTap={props.disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40',
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
