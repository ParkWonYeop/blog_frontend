import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getSearchPageHref } from '@/features/post/search';

const controlClass = 'inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text-muted)]';

export default function SearchPagination({ keyword, page, totalPages }: { keyword: string; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="검색 결과 페이지" className="mt-5 flex min-w-0 items-center justify-between gap-2 border-t border-[var(--color-line)] pt-4">
      {page > 1 ? (
        <Link href={getSearchPageHref(keyword, page - 1)} rel="prev" className={`${controlClass} transition hover:bg-[var(--card-bg-strong)]`}>
          <ChevronLeft size={16} /> 이전
        </Link>
      ) : (
        <span aria-disabled="true" className={`${controlClass} opacity-40`}><ChevronLeft size={16} /> 이전</span>
      )}
      <span aria-current="page" className="min-w-0 text-center text-sm tabular-nums text-[var(--color-text-muted)]">
        <span className="font-bold text-[var(--color-text)]">{page}</span> / {totalPages} 페이지
      </span>
      {page < totalPages ? (
        <Link href={getSearchPageHref(keyword, page + 1)} rel="next" className={`${controlClass} transition hover:bg-[var(--card-bg-strong)]`}>
          다음 <ChevronRight size={16} />
        </Link>
      ) : (
        <span aria-disabled="true" className={`${controlClass} opacity-40`}>다음 <ChevronRight size={16} /></span>
      )}
    </nav>
  );
}
