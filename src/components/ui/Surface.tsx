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
        'rounded-lg border border-[var(--card-border)] backdrop-blur-[18px]',
        strong
          ? 'bg-[var(--card-bg-strong)] shadow-[var(--shadow-card)]'
          : 'bg-[var(--card-bg)] shadow-[var(--shadow-card)]',
        interactive && 'transition duration-150 hover:-translate-y-0.5 hover:border-[var(--card-border-hover)] hover:bg-[var(--card-bg-strong)] hover:shadow-[var(--shadow-control)]',
        className,
      )}
      {...props}
    />
  );
}
