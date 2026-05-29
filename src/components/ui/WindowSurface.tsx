import { clsx } from 'clsx';
import { HTMLAttributes, ReactNode } from 'react';

type WindowSurfaceElement = 'div' | 'section' | 'article' | 'aside' | 'main';

interface WindowSurfaceProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  as?: WindowSurfaceElement;
  title?: ReactNode;
  subtitle?: ReactNode;
  controls?: ReactNode;
  showTrafficLights?: boolean;
  bodyClassName?: string;
}

export default function WindowSurface({
  as: Component = 'section',
  title,
  subtitle,
  controls,
  showTrafficLights = true,
  className,
  bodyClassName,
  children,
  ...props
}: WindowSurfaceProps) {
  const hasTitlebar = Boolean(title || subtitle || controls || showTrafficLights);

  return (
    <Component
      className={clsx(
        'w-full overflow-hidden rounded-lg border border-[var(--window-border)] bg-[var(--window-bg)] shadow-[var(--shadow-window)] backdrop-blur-[28px]',
        className,
      )}
      {...props}
    >
      {hasTitlebar && (
        <div className="flex min-h-11 items-center justify-between gap-4 border-b border-[var(--window-titlebar-border)] bg-[var(--window-titlebar)] px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            {showTrafficLights && (
              <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#28c840]" />
              </div>
            )}

            {(title || subtitle) && (
              <div className="min-w-0">
                {title && (
                  <div className="truncate text-sm font-semibold text-[var(--color-text)]">
                    {title}
                  </div>
                )}
                {subtitle && (
                  <div className="truncate text-xs font-medium text-[var(--color-text-subtle)]">
                    {subtitle}
                  </div>
                )}
              </div>
            )}
          </div>

          {controls && <div className="shrink-0">{controls}</div>}
        </div>
      )}

      <div className={bodyClassName}>{children}</div>
    </Component>
  );
}
