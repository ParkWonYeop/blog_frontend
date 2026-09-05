'use client';

import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HistoryEntry } from '@/features/chess/lib';

interface ChessMoveListProps {
  history: HistoryEntry[];
  /** 0은 시작 국면, history.length는 현재 국면 */
  currentPly: number;
  onSelectPly: (ply: number) => void;
}

const navButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-40';

export default function ChessMoveList({ history, currentPly, onSelectPly }: ChessMoveListProps) {
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const lastPly = history.length;
  const rows = Array.from({ length: Math.ceil(lastPly / 2) }, (_, index) => ({
    number: index + 1,
    white: history[index * 2],
    black: history[index * 2 + 1],
  }));

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [currentPly]);

  const renderPly = (entry?: HistoryEntry) => {
    if (!entry) return <span className="px-2 text-[var(--color-text-subtle)]">…</span>;

    const isActive = entry.ply === currentPly;

    return (
      <button
        ref={isActive ? activeRef : undefined}
        type="button"
        onClick={() => onSelectPly(entry.ply)}
        aria-current={isActive ? 'step' : undefined}
        className={clsx(
          'w-full rounded px-2 py-0.5 text-left font-mono text-sm transition',
          isActive
            ? 'bg-[var(--color-accent)] font-semibold text-white'
            : 'text-[var(--color-text)] hover:bg-[var(--color-accent-soft)]',
        )}
      >
        {entry.san}
      </button>
    );
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-[var(--color-text)]">
          기보
          <span className="ml-1.5 text-xs font-semibold text-[var(--color-text-subtle)]">
            {currentPly < lastPly ? `${currentPly} / ${lastPly}` : `${lastPly}수`}
          </span>
        </p>
        <div className="flex items-center gap-1" role="group" aria-label="기보 탐색">
          <button type="button" className={navButtonClass} onClick={() => onSelectPly(0)} disabled={currentPly === 0} aria-label="처음으로">
            <ChevronFirst size={16} />
          </button>
          <button type="button" className={navButtonClass} onClick={() => onSelectPly(currentPly - 1)} disabled={currentPly === 0} aria-label="이전 수" title="이전 수 (←)">
            <ChevronLeft size={16} />
          </button>
          <button type="button" className={navButtonClass} onClick={() => onSelectPly(currentPly + 1)} disabled={currentPly >= lastPly} aria-label="다음 수" title="다음 수 (→)">
            <ChevronRight size={16} />
          </button>
          <button type="button" className={navButtonClass} onClick={() => onSelectPly(lastPly)} disabled={currentPly >= lastPly} aria-label="마지막으로">
            <ChevronLast size={16} />
          </button>
        </div>
      </div>

      <div className="max-h-52 overflow-y-auto rounded-lg border border-[var(--color-line)] bg-black/[0.025] p-1 dark:bg-white/[0.06]">
        {rows.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-[var(--color-text-subtle)]">아직 둔 수가 없습니다.</p>
        ) : (
          <ol className="grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-y-0.5">
            {rows.map((row) => (
              <li key={row.number} className="contents">
                <span className="px-2 text-right font-mono text-xs text-[var(--color-text-subtle)]">{row.number}.</span>
                {renderPly(row.white)}
                {renderPly(row.black)}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
