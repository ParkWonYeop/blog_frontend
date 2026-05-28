import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-line)] bg-white/45 px-5 py-10 text-center dark:bg-white/5',
        className,
      )}
    >
      {icon && <div className="mb-3 text-[var(--color-text-subtle)]">{icon}</div>}
      <p className="text-sm font-semibold text-[var(--color-text-muted)]">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--color-text-subtle)]">
          {description}
        </p>
      )}
    </div>
  );
}
