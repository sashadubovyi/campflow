import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
}

/**
 * Єдиний хедер сторінок. Фіксована висота (py-3), назва завжди по центру.
 * left/right — слоти однакової мінімальної ширини, щоб title залишався
 * відцентрованим незалежно від наявності кнопок.
 */
export function PageHeader({ title, left, right }: PageHeaderProps) {
  return (
    <header className="relative bg-white/75 backdrop-blur-xl border-b border-neutral-100/60 shrink-0 px-4 md:px-6 h-12 flex items-center">
      <div className="shrink-0">{left}</div>
      <h1 className="font-display text-lg font-bold text-neutral-900 text-center truncate px-2 absolute left-1/2 -translate-x-1/2 pointer-events-none">
        {title}
      </h1>
      <div className="ml-auto flex items-center gap-2 shrink-0">{right}</div>
    </header>
  );
}
