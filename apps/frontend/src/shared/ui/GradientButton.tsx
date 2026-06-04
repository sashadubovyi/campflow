import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
}

export function GradientButton({ children, loading, className, disabled, ...props }: GradientButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        'px-5 py-2.5 rounded-xl font-semibold text-sm',
        'bg-white border-2 border-transparent',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      style={{
        background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #2dd4bf, #818cf8, #c084fc) border-box',
        ...props.style,
      }}
    >
      <span
        style={{
          background: 'linear-gradient(135deg, #2dd4bf, #818cf8, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ WebkitTextFillColor: 'initial' }} />
        ) : children}
      </span>
    </button>
  );
}
