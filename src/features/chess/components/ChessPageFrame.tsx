import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface ChessPageFrameProps {
  title?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** 체스 화면 공통 틀: 제목 줄(선택) + 본문. 제목이 없으면 본문만 감싼다. */
export default function ChessPageFrame({ title, backHref, backLabel, actions, children }: ChessPageFrameProps) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1180px] flex-col gap-5 px-0 py-3 md:py-6">
      {title && (
        <section className="flex min-w-0 flex-col gap-2 border-b border-[var(--color-line)] pb-5">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <h1 className="min-w-0 break-words text-2xl font-bold tracking-normal text-[var(--color-text)] md:text-3xl">
              {title}
            </h1>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
          </div>
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--color-text-subtle)] transition hover:text-[var(--color-accent)]"
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
