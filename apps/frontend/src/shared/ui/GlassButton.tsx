import { useRef, useCallback, type ReactNode, type CSSProperties } from 'react';
import { m, useSpring, useMotionValue, useMotionTemplate, type HTMLMotionProps } from 'framer-motion';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'ai';

interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: ReactNode;
  variant?: Variant;
  loading?: boolean;
  iconOnly?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-accent-500/13 border border-accent-500/30 text-accent-700 hover:bg-accent-500/20 hover:border-accent-500/45',
  secondary:
    'bg-white/55 border border-white/70 text-neutral-700 hover:bg-white/72 hover:border-white/85',
  ghost:
    'bg-transparent border border-transparent text-neutral-500 hover:bg-gemini-active-hover hover:border-accent-200/30 hover:text-accent-600',
  destructive:
    'bg-danger-500/10 border border-danger-500/25 text-danger-700 hover:bg-danger-500/18 hover:border-danger-500/40',
  ai: 'border text-transparent',
};

export function GlassButton({
  children,
  variant = 'secondary',
  loading = false,
  iconOnly = false,
  className,
  disabled,
  style,
  ...props
}: GlassButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const shineX = useMotionValue(50);
  const shineY = useMotionValue(50);
  const shineOpacity = useMotionValue(0);

  const springX = useSpring(shineX, { stiffness: 200, damping: 20 });
  const springY = useSpring(shineY, { stiffness: 200, damping: 20 });
  const springOpacity = useSpring(shineOpacity, { stiffness: 300, damping: 25 });

  const shineBackground = useMotionTemplate`radial-gradient(circle at ${springX}% ${springY}%, rgba(255,255,255,0.36) 0%, transparent 65%)`;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (prefersReducedMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      shineX.set(((e.clientX - rect.left) / rect.width) * 100);
      shineY.set(((e.clientY - rect.top) / rect.height) * 100);
    },
    [prefersReducedMotion, shineX, shineY],
  );

  const handleMouseEnter = useCallback(() => {
    if (!prefersReducedMotion) shineOpacity.set(1);
  }, [prefersReducedMotion, shineOpacity]);

  const handleMouseLeave = useCallback(() => {
    shineOpacity.set(0);
  }, [shineOpacity]);

  const aiStyle: CSSProperties =
    variant === 'ai'
      ? {
          background:
            'linear-gradient(rgba(255,255,255,0.70), rgba(255,255,255,0.70)) padding-box, linear-gradient(135deg, #818cf8, #c084fc, #f472b6, #818cf8) border-box',
          borderColor: 'transparent',
        }
      : {};

  const aiTextStyle: CSSProperties =
    variant === 'ai'
      ? {
          background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }
      : {};

  return (
    <m.button
      ref={ref}
      {...props}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden',
        'font-semibold text-sm transition-all duration-200',
        iconOnly ? 'w-10 h-10 rounded-xl p-0' : 'px-4 py-2.5 rounded-2xl',
        'backdrop-filter backdrop-blur-sm',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        className,
      )}
      style={{ ...aiStyle, ...style }}
    >
      {/* Mouse-tracking glare overlay */}
      <m.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ background: shineBackground, opacity: springOpacity }}
      />

      {loading ? (
        <span className={cn(
          "inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin",
          variant === 'ai' ? 'border-violet-500' : 'border-current',
        )} />
      ) : variant === 'ai' ? (
        <span style={aiTextStyle}>{children}</span>
      ) : (
        children
      )}
    </m.button>
  );
}
