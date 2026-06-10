import { useId } from 'react';
import { m } from 'framer-motion';
import { cn } from './cn';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: Props<T>) {
  const id = useId();

  return (
    <div
      className={cn(
        'inline-flex p-1 rounded-2xl',
        'bg-white/35 border border-white/50 backdrop-blur-md',
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative px-3.5 h-8 rounded-xl text-sm font-semibold transition-colors duration-200',
            value === opt.value ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700',
          )}
        >
          {value === opt.value && (
            <m.span
              layoutId={`${id}-seg`}
              className="absolute inset-0 rounded-xl bg-white/85 border border-white/90 shadow-glass"
              style={{ borderRadius: 10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
