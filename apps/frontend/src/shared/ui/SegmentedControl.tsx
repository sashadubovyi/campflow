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
  return (
    <div className={cn('inline-flex p-1 gap-1 bg-neutral-100 rounded-xl', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 h-8 rounded-lg text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
