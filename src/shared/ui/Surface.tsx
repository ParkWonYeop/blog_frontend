import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

type SurfaceElement = 'div' | 'section' | 'article' | 'aside';

interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: SurfaceElement;
  strong?: boolean;
  interactive?: boolean;
  outlined?: boolean;
}

export default function Surface({
  as: Component = 'div',
  strong = false,
  interactive = false,
  outlined = false,
  className,
  ...props
}: SurfaceProps) {
  return (
    <Component
      className={clsx(
        'rounded-2xl',
        outlined
          ? 'border border-[var(--card-border)]'
          : strong ? 'bg-[var(--color-surface-strong)]' : 'bg-[var(--color-surface)]',
        interactive && (outlined ? 'transition-colors hover:border-[var(--color-text)]' : 'transition-colors hover:bg-[var(--color-surface-strong)]'),
        className,
      )}
      {...props}
    />
  );
}
