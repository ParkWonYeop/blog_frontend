'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

/** 주기적으로 갱신되는 현재 시각. 시계·카운트다운 표시용. */
export function useNow(intervalMs: number, enabled = true) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return undefined;

    const timer = setInterval(() => setNow(Date.now()), intervalMs);

    return () => clearInterval(timer);
  }, [enabled, intervalMs]);

  return now;
}

interface ChessClockProps {
  /** 서버가 응답한 시점의 남은 시간 */
  millis: number;
  /** 서버 응답을 받은 로컬 시각. 여기서부터 흐른 시간을 뺀다. */
  receivedAt: number;
  running: boolean;
  active: boolean;
}

export const formatClock = (millis: number) => {
  const clamped = Math.max(0, millis);
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (clamped < 10_000) return `${seconds}.${Math.floor((clamped % 1000) / 100)}`;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export default function ChessClock({ millis, receivedAt, running, active }: ChessClockProps) {
  const now = useNow(100, running);
  const remaining = running ? millis - (now - receivedAt) : millis;
  const isLow = active && remaining < 10_000;

  return (
    <span
      className={clsx(
        'inline-flex min-w-[4.5rem] items-center justify-center rounded-lg border px-2.5 py-1 font-mono text-lg font-bold tabular-nums leading-none',
        active
          ? isLow
            ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'border-[var(--color-line)] bg-black/[0.025] text-[var(--color-text-muted)] dark:bg-white/[0.06]',
      )}
      aria-live={isLow ? 'polite' : undefined}
    >
      {formatClock(remaining)}
    </span>
  );
}
