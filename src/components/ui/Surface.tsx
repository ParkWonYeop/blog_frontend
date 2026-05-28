import { clsx } from 'clsx';
import { HTMLAttributes } from 'react';

type SurfaceElement = 'div' | 'section' | 'article' | 'aside';

interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: SurfaceElement;
  strong?: boolean;
  interactive?: boolean;
}

export default function Surface({
  as: Component = 'div',
  strong = false,
  interactive = false,
  className,
  ...props
}: SurfaceProps) {
  return (
    <Component
      className={clsx(
        'rounded-lg border border-[var(--color-line)] backdrop-blur-xl',
        strong ? 'bg-[var(--color-surface-strong)] shadow-[var(--shadow-panel)]' : 'bg-[var(--color-surface)] shadow-[var(--shadow-card)]',
        interactive && 'transition duration-150 hover:border-black/10 hover:bg-white/90 hover:shadow-[var(--shadow-panel)] dark:hover:border-white/15 dark:hover:bg-white/10',
        className,
      )}
      {...props}
    />
  );
}
