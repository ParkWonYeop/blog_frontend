'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { ThemeMode } from './theme';
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
      className="inline-flex h-9 shrink-0 items-center rounded-full border border-[var(--color-line)] bg-[var(--color-control)] p-1 shadow-[var(--shadow-control)] backdrop-blur-2xl"
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
              'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition duration-150 sm:w-8',
              isSelected
                ? 'bg-[var(--window-bg-strong)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-subtle)] hover:bg-black/[0.04] hover:text-[var(--color-text)] dark:hover:bg-white/10',
            )}
          >
            <Icon size={15} strokeWidth={2.2} />
          </button>
        );
      })}
    </div>
  );
}
