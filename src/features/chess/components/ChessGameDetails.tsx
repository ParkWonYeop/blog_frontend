'use client';

import { useState, type ReactNode } from 'react';
import { usePageFocus } from '@/shared/layout/PageFocusContext';

export default function ChessGameDetails({ children, ended = false, label = '기보 및 대국 정보' }: { children: ReactNode; ended?: boolean; label?: string }) {
  const { isFocused } = usePageFocus();
  const [expanded, setExpanded] = useState(false);
  if (!isFocused || ended) return children;
  return (
    <details open={expanded} className="min-w-0">
      <summary onClick={(event) => { event.preventDefault(); setExpanded(!expanded); }} className="min-h-11 cursor-pointer rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-4 py-3 text-sm font-semibold text-[var(--color-text-muted)]">
        {label}
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}
