import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

type WindowSurfaceElement = 'div' | 'section' | 'article' | 'aside';

interface WindowSurfaceProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  as?: WindowSurfaceElement;
  title?: ReactNode;
  subtitle?: ReactNode;
  controls?: ReactNode;
  bodyClassName?: string;
}

export default function WindowSurface({
  as: Component = 'section',
  title,
  subtitle,
  controls,
  className,
  bodyClassName,
  children,
  ...props
}: WindowSurfaceProps) {
  const hasHeader = Boolean(title || subtitle || controls);

  return (
    <Component
      className={clsx(
        'w-full min-w-0 overflow-hidden rounded-3xl border border-[var(--card-border)] bg-[var(--color-page)]',
        className,
      )}
      {...props}
    >
      {hasHeader && (
        <div className="flex min-h-14 items-center justify-between gap-4 border-b border-[var(--stroke-subtle)] px-5 py-3">
          <div className="min-w-0">
            {title && <div className="truncate text-body1 font-bold text-[var(--color-text)]">{title}</div>}
            {subtitle && <div className="truncate text-caption1 text-[var(--color-text-subtle)]">{subtitle}</div>}
          </div>
          {controls && <div className="shrink-0">{controls}</div>}
        </div>
      )}

      <div className={bodyClassName}>{children}</div>
    </Component>
  );
}
