import { clsx } from 'clsx';

export interface SegmentedControlOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  ariaLabel: string;
  options: SegmentedControlOption<T>[];
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
      className={clsx(
        'inline-flex h-9 rounded-full border border-[var(--color-line)] bg-[var(--color-control)] p-1 shadow-[var(--shadow-control)] backdrop-blur-xl',
        className,
      )}
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
              'min-w-14 rounded-full px-3 text-sm font-semibold transition duration-150',
              isSelected
                ? 'bg-[var(--color-surface-strong)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:bg-black/[0.04] hover:text-[var(--color-text)] dark:hover:bg-white/10',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
