import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--color-surface)] text-[var(--color-text-muted)]',
  info: 'border border-[var(--stroke-weak)] text-[var(--color-text)]',
  success: 'bg-[var(--color-inverse)] text-[var(--color-on-inverse)]',
  warning: 'bg-[var(--color-surface-strong)] text-[var(--color-text)]',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
};

export default function StatusBadge({
  tone = 'neutral',
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex h-[22px] max-w-full items-center gap-1 rounded-sm px-1.5 text-caption2 font-semibold',
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
