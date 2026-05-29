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
        'rounded-lg border border-[var(--window-border)] backdrop-blur-2xl',
        strong
          ? 'bg-[var(--window-bg-strong)] shadow-[var(--shadow-card)]'
          : 'bg-[var(--window-bg)] shadow-[var(--shadow-card)]',
        interactive && 'transition duration-150 hover:-translate-y-0.5 hover:border-black/15 hover:bg-[var(--window-bg-strong)] hover:shadow-[var(--shadow-control)] dark:hover:border-white/20',
        className,
      )}
      {...props}
    />
  );
}
