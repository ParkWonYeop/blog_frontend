import type { ReactNode } from 'react';
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
    <div className={clsx('flex min-h-36 flex-col items-center justify-center px-5 py-12 text-center', className)}>
      {icon && <div className="mb-3 text-[var(--color-text-placeholder)]">{icon}</div>}
      <p className="text-body1 font-medium text-[var(--color-text-muted)]">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-body2 text-[var(--color-text-subtle)]">{description}</p>
      )}
    </div>
  );
}
