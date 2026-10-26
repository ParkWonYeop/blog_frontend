'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, LayoutGrid, List, Loader2 } from 'lucide-react';
import { getPostsByCategory } from '@/features/post/api';
import PostCard from '@/features/post/components/PostCard';
import PostListItem from '@/features/post/components/PostListItem';
import PostSearch from '@/features/post/components/PostSearch';
import EmptyState from '@/shared/ui/EmptyState';
import SegmentedControl from '@/shared/ui/SegmentedControl';
import { isNoticeCategoryName } from '@/features/post/lib';
import { decodePathSegment } from '@/shared/lib/paths';
import { queryKeys } from '@/shared/lib/queryKeys';

const PAGE_SIZE_OPTIONS = [
  { label: '9개', value: '9' },
  { label: '18개', value: '18' },
  { label: '27개', value: '27' },
] as const;
const DEFAULT_PAGE_SIZE = '9';
const CATEGORY_PAGE_SIZE_STORAGE_KEY = 'categoryPageSize';

type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]['value'];

const isPageSizeOption = (value: string | null): value is PageSizeOption => {
  return PAGE_SIZE_OPTIONS.some((option) => option.value === value);
};

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const categoryName = decodePathSegment(id);
  const apiCategoryName = categoryName === 'uncategorized' ? '미분류' : categoryName;
  const isNoticeCategory = isNoticeCategoryName(apiCategoryName);

  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [pageSize, setPageSize] = useState<PageSizeOption>(() => {
    if (typeof window === 'undefined') return DEFAULT_PAGE_SIZE;

    const savedSize = localStorage.getItem(CATEGORY_PAGE_SIZE_STORAGE_KEY);
    return isPageSizeOption(savedSize) ? savedSize : DEFAULT_PAGE_SIZE;
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (isNoticeCategory || typeof window === 'undefined') return isNoticeCategory ? 'list' : 'grid';

    const savedMode = localStorage.getItem('postViewMode');
    return savedMode === 'list' ? 'list' : 'grid';
  });
  const activeViewMode = isNoticeCategory ? 'list' : viewMode;

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    if (!isNoticeCategory) {
      localStorage.setItem('postViewMode', mode);
    }
  };

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword);
    setPage(0);
  };

  const handlePageSizeChange = (nextSize: PageSizeOption) => {
    setPage(0);
    setPageSize(nextSize);
    localStorage.setItem(CATEGORY_PAGE_SIZE_STORAGE_KEY, nextSize);
  };

  const { data: postsData, isLoading, error, isPlaceholderData } = useQuery({
    queryKey: queryKeys.posts.category(apiCategoryName, page, pageSize, keyword),
    queryFn: () => getPostsByCategory(apiCategoryName, page, Number(pageSize), keyword),
    placeholderData: (previousData) => previousData,
  });

  if (isLoading || (postsData === undefined && !error)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-text-subtle)]" size={28} aria-label="불러오는 중" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1040px]">
        <h1 className="break-words font-pixel text-pixel-l text-[var(--color-text)]">{apiCategoryName}</h1>
        <EmptyState title="글을 불러오지 못했어요" className="mt-6" />
      </div>
    );
  }

  const posts = postsData?.content || [];
  const pagingData = postsData?.page || postsData;
  const totalElements = pagingData?.totalElements ?? 0;
  const totalPages = pagingData?.totalPages ?? 0;
  const isLast = pagingData?.number !== undefined
    ? pagingData.number + 1 >= totalPages
    : (postsData?.last ?? true);

  const handlePrevPage = () => setPage((old) => Math.max(old - 1, 0));
  const handleNextPage = () => {
    if (!isLast) setPage((old) => old + 1);
  };

  const viewButtonClass = (mode: 'grid' | 'list') => clsx(
    'flex h-8 w-9 items-center justify-center rounded-sm transition-colors',
    activeViewMode === mode
      ? 'bg-[var(--color-raised)] text-[var(--color-text)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
      : 'text-[var(--color-text-subtle)] hover:text-[var(--color-text)]',
  );
  const pageButtonClass = 'flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-control)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-strong)] disabled:cursor-not-allowed disabled:bg-transparent disabled:text-[var(--color-text-disabled)]';

  return (
    <div className="mx-auto min-w-0 max-w-[1040px]">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="break-words font-pixel text-pixel-l text-[var(--color-text)] md:text-pixel-xl">{apiCategoryName}</h1>
          <p className="mt-1 text-body2 text-[var(--color-text-subtle)]">
            {keyword ? `‘${keyword}’ 검색 결과 ` : '글 '}
            <span className="font-semibold tabular-nums text-[var(--color-text)]">{totalElements.toLocaleString()}</span>개
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <PostSearch
            onSearch={handleSearch}
            placeholder={`${apiCategoryName}에서 검색`}
            className="sm:w-64"
          />
          <div className="flex items-center gap-2">
            <SegmentedControl
              ariaLabel="페이지당 게시글 수"
              options={PAGE_SIZE_OPTIONS}
              value={pageSize}
              onChange={handlePageSizeChange}
              className="flex-1 sm:flex-none"
            />
            {!isNoticeCategory && (
              <div role="group" aria-label="보기 방식" className="flex h-10 shrink-0 items-center rounded-xl bg-[var(--color-control)] p-1">
                <button
                  type="button"
                  onClick={() => handleViewModeChange('grid')}
                  className={viewButtonClass('grid')}
                  title="카드로 보기"
                  aria-label="카드로 보기"
                  aria-pressed={activeViewMode === 'grid'}
                >
                  <LayoutGrid size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('list')}
                  className={viewButtonClass('list')}
                  title="리스트로 보기"
                  aria-label="리스트로 보기"
                  aria-pressed={activeViewMode === 'list'}
                >
                  <List size={17} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mt-8">
        {posts.length === 0 ? (
          <EmptyState title={keyword ? '검색 결과가 없어요' : '아직 쓴 글이 없어요'} className="py-20" />
        ) : (
          <>
            {activeViewMode === 'grid' ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <ul className="border-t border-[var(--stroke-subtle)]">
                {posts.map((post) => (
                  <PostListItem key={post.id} post={post} withSummary />
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <nav aria-label="페이지" className="mt-10 flex items-center justify-center gap-4">
                <button type="button" onClick={handlePrevPage} disabled={page === 0} className={pageButtonClass} aria-label="이전 페이지">
                  <ChevronLeft size={20} />
                </button>
                <span className="min-w-14 text-center text-body2 tabular-nums text-[var(--color-text-subtle)]">
                  <span className="font-bold text-[var(--color-text)]">{page + 1}</span> / {totalPages}
                </span>
                <button type="button" onClick={handleNextPage} disabled={isLast || isPlaceholderData} className={pageButtonClass} aria-label="다음 페이지">
                  <ChevronRight size={20} />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
