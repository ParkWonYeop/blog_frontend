import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClass: Record<BadgeTone, string> = {
  neutral: 'border-black/10 bg-black/[0.04] text-[var(--color-text-muted)] dark:border-white/10 dark:bg-white/10',
  info: 'border-blue-500/15 bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
  success: 'border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  danger: 'border-red-500/15 bg-red-500/10 text-red-700 dark:text-red-300',
};

export default function StatusBadge({
  tone = 'neutral',
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none',
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
