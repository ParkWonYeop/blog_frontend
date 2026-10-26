import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getSearchPageHref } from '@/features/post/search';

const controlClass = 'inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-lg bg-[var(--color-control)] px-3.5 text-body2 font-semibold text-[var(--color-text)]';

export default function SearchPagination({ keyword, page, totalPages }: { keyword: string; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="검색 결과 페이지" className="mt-8 flex min-w-0 items-center justify-between gap-2">
      {page > 1 ? (
        <Link href={getSearchPageHref(keyword, page - 1)} rel="prev" className={`${controlClass} transition-colors hover:bg-[var(--color-surface-strong)]`}>
          <ChevronLeft size={16} /> 이전
        </Link>
      ) : (
        <span aria-disabled="true" className={`${controlClass} text-[var(--color-text-disabled)]`}><ChevronLeft size={16} /> 이전</span>
      )}
      <span aria-current="page" className="min-w-0 text-center text-body2 tabular-nums text-[var(--color-text-subtle)]">
        <span className="font-bold text-[var(--color-text)]">{page}</span> / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={getSearchPageHref(keyword, page + 1)} rel="next" className={`${controlClass} transition-colors hover:bg-[var(--color-surface-strong)]`}>
          다음 <ChevronRight size={16} />
        </Link>
      ) : (
        <span aria-disabled="true" className={`${controlClass} text-[var(--color-text-disabled)]`}>다음 <ChevronRight size={16} /></span>
      )}
    </nav>
  );
}
