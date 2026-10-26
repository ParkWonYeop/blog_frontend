import { clsx } from 'clsx';

export interface SegmentedControlOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  ariaLabel: string;
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function SegmentedControl<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={clsx('inline-flex h-10 rounded-xl bg-[var(--color-control)] p-1', className)}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={clsx(
              'min-w-14 flex-1 rounded-lg px-3 text-body2 font-semibold transition-colors',
              isSelected
                ? 'bg-[var(--color-raised)] text-[var(--color-text)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                : 'text-[var(--color-text-subtle)] hover:text-[var(--color-text)]',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
