import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
}

export function PageHeader({ title, left, right }: PageHeaderProps) {
  return (
    <header className="relative glass-header shadow-[0_0.5px_0_rgba(0,0,0,0.06)] shrink-0 px-4 md:px-6 h-12 flex items-center">
      <div className="shrink-0">{left}</div>
      <h1 className="font-display text-base font-bold text-neutral-900 text-center truncate px-2 absolute left-1/2 -translate-x-1/2 pointer-events-none">
        {title}
      </h1>
      <div className="ml-auto flex items-center gap-2 shrink-0">{right}</div>
    </header>
  );
}
