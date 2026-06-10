import { useId } from 'react';
import { motion } from 'framer-motion';
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
    <div className={cn('inline-flex p-1 bg-neutral-100 rounded-xl', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative px-3 h-8 rounded-lg text-sm font-medium transition-colors',
            value === opt.value ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700',
          )}
        >
          {value === opt.value && (
            <motion.span
              layoutId={`${id}-seg`}
              className="absolute inset-0 rounded-lg bg-white shadow-sm"
              style={{ borderRadius: 8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
