'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronLeft, Minimize2 } from 'lucide-react';
import { clsx } from 'clsx';
import { usePageFocus } from '@/shared/layout/PageFocusContext';

interface ChessPageFrameProps {
  title?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** 체스 화면 공통 틀: 제목 줄(선택) + 본문. 제목이 없으면 본문만 감싼다. */
export default function ChessPageFrame({ title, backHref, backLabel, actions, children }: ChessPageFrameProps) {
  const { isFocused, setFocused } = usePageFocus();
  return (
    <div className={clsx('mx-auto flex w-full min-w-0 flex-col gap-3', isFocused ? 'max-w-[44rem]' : 'max-w-[1040px] sm:gap-5')}>
      {isFocused && (
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-semibold text-[var(--color-text)]">{title ?? '체스'}</h1>
          <button type="button" onClick={() => setFocused(false)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-caption1 font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-hover)]">
            <Minimize2 size={16} /> 집중 모드 해제
          </button>
        </div>
      )}
      {title && !isFocused && (
        <section className="flex min-w-0 flex-col gap-1 px-2 pb-1 sm:px-0 sm:pb-3">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <h1 className="min-w-0 break-words text-title2 font-bold text-[var(--color-text)] md:text-title1">
              {title}
            </h1>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
          </div>
          {backHref && (
            <Link
              href={backHref}
              className="-ml-1 inline-flex min-h-10 w-fit items-center gap-1 rounded-lg px-1 text-body2 font-semibold text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-text)]"
            >
              <ChevronLeft size={15} />
              {backLabel ?? '뒤로'}
            </Link>
          )}
        </section>
      )}
      {children}
    </div>
  );
}
