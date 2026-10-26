'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import type { ThemeMode } from './theme';
import { useTheme } from './ThemeProvider';

const options: Array<{
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  { value: 'light', label: '라이트', icon: Sun },
  { value: 'system', label: '시스템', icon: Monitor },
  { value: 'dark', label: '다크', icon: Moon },
];

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div
      className="inline-flex h-9 shrink-0 items-center rounded-lg bg-[var(--color-control)] p-0.5"
      role="group"
      aria-label="화면 테마"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = mode === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${option.label} 모드`}
            title={`${option.label} 모드`}
            onClick={() => setMode(option.value)}
            className={clsx(
              'inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors',
              isSelected
                ? 'bg-[var(--color-raised)] text-[var(--color-text)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                : 'text-[var(--color-text-subtle)] hover:text-[var(--color-text)]',
            )}
          >
            <Icon size={16} strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
