import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import Surface from './Surface';

interface MetricCardProps {
  label: string;
  value?: number | string | null;
  icon?: ReactNode;
  helper?: string;
  changeRate?: number | null;
  disabled?: boolean;
  className?: string;
}

const formatValue = (value?: number | string | null) => {
  if (value === null || value === undefined) return '통계 API 연결 전';
  if (typeof value === 'number') return value.toLocaleString();
  return value;
};

export default function MetricCard({
  label,
  value,
  icon,
  helper,
  changeRate,
  disabled = false,
  className,
}: MetricCardProps) {
  const hasChange = typeof changeRate === 'number';
  const isPositive = hasChange && changeRate >= 0;

  return (
    <Surface outlined className={clsx('p-5', disabled && 'opacity-70', className)}>
      <div className="flex items-center justify-between gap-3 text-[var(--color-text-subtle)]">
        <span className="text-body2 font-medium text-[var(--color-text-muted)]">{label}</span>
        {icon}
      </div>
      <p
        className={clsx(
          'mt-3 break-keep text-title1 font-bold tabular-nums text-[var(--color-text)]',
          disabled && 'text-body1 font-medium text-[var(--color-text-muted)]',
        )}
      >
        {formatValue(value)}
      </p>
      {(helper || hasChange) && (
        <p className="mt-1 text-caption1 font-medium tabular-nums text-[var(--color-text-subtle)]">
          {hasChange ? `${isPositive ? '+' : ''}${changeRate.toFixed(1)}%` : helper}
        </p>
      )}
    </Surface>
  );
}
