import { type ReactNode } from 'react';
import { m, type HTMLMotionProps } from 'framer-motion';
import { cn } from './cn';

interface GradientButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: ReactNode;
  loading?: boolean;
}

export function GradientButton({ children, loading, className, disabled, ...props }: GradientButtonProps) {
  return (
    <m.button
      {...props}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        'px-5 py-2.5 rounded-2xl font-semibold text-sm',
        'bg-white/60 border border-white/70 backdrop-blur-md',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      style={{
        background: 'linear-gradient(rgba(255,255,255,0.70), rgba(255,255,255,0.70)) padding-box, linear-gradient(135deg, #818cf8, #c084fc, #f472b6, #818cf8) border-box',
        borderColor: 'transparent',
        ...props.style,
      }}
    >
      <span
        style={{
          background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {loading ? (
          <span
            className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            style={{ WebkitTextFillColor: 'initial' }}
          />
        ) : children}
      </span>
    </m.button>
  );
}
