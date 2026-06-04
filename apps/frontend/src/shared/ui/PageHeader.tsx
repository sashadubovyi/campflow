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
    <header className="relative bg-white border-b border-neutral-100 shrink-0 px-4 h-14 flex items-center">
      <div className="flex items-center justify-start min-w-[2.5rem] shrink-0">{left}</div>
      <h1 className="flex-1 font-display text-lg font-bold text-neutral-900 text-center truncate px-2">
        {title}
      </h1>
      <div className="flex items-center justify-end gap-2 min-w-[2.5rem] shrink-0">{right}</div>
    </header>
  );
}
