'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, FolderOpen, LayoutGrid, List, Loader2, Search as SearchIcon } from 'lucide-react';
import { getPostsByCategory } from '@/features/post/api';
import PostCard from '@/features/post/components/PostCard';
import PostListItem from '@/features/post/components/PostListItem';
import PostSearch from '@/features/post/components/PostSearch';
import EmptyState from '@/shared/ui/EmptyState';
import SegmentedControl from '@/shared/ui/SegmentedControl';
import Surface from '@/shared/ui/Surface';
import WindowSurface from '@/shared/ui/WindowSurface';
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
        <Loader2 className="animate-spin text-[var(--color-accent)]" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <WindowSurface className="mx-auto md:w-[70vw] md:max-w-[900px]" bodyClassName="px-5 py-10 text-center text-red-500">
        게시글을 불러오는 중 오류가 발생했습니다.
        <br />
        <span className="text-sm text-[var(--color-text-subtle)]">카테고리 이름을 확인해 주세요.</span>
      </WindowSurface>
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

  return (
    <div className="mx-auto w-full px-0 py-4 md:w-[78vw] md:max-w-[1280px] md:py-6">
      <WindowSurface
        title="Finder"
        subtitle={apiCategoryName}
        bodyClassName="p-5 md:p-6"
      >
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--color-line)] pb-5 md:flex-row md:items-center">
          <h1 className="flex min-w-0 items-center gap-3 text-2xl font-bold tracking-normal text-[var(--color-text)]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-[var(--shadow-control)]">
              <FolderOpen size={20} />
            </span>
            <span className="min-w-0 truncate">{apiCategoryName}</span>
            <span className="text-lg font-normal text-[var(--color-text-subtle)]">글 목록</span>
          </h1>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <PostSearch
              onSearch={handleSearch}
              placeholder={`${apiCategoryName} 검색`}
              className="w-full md:w-64"
            />

            <SegmentedControl
              ariaLabel="페이지당 게시글 수"
              options={PAGE_SIZE_OPTIONS}
              value={pageSize}
              onChange={handlePageSizeChange}
              className="justify-center"
            />

            <div className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--control-border)] bg-[var(--color-control)] p-1 shadow-[var(--shadow-control)] backdrop-blur-[18px]">
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className={clsx(
                  'rounded-full p-2 transition-all duration-150',
                  activeViewMode === 'grid'
                    ? 'bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-sm'
                    : 'text-[var(--color-text-subtle)] hover:bg-[var(--card-bg)] hover:text-[var(--color-text)]',
                )}
                title="카드로 보기"
                aria-label="카드로 보기"
                aria-pressed={activeViewMode === 'grid'}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                className={clsx(
                  'rounded-full p-2 transition-all duration-150',
                  activeViewMode === 'list'
                    ? 'bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-sm'
                    : 'text-[var(--color-text-subtle)] hover:bg-[var(--card-bg)] hover:text-[var(--color-text)]',
                )}
                title="리스트로 보기"
                aria-label="리스트로 보기"
                aria-pressed={activeViewMode === 'list'}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {keyword && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
            <SearchIcon size={16} className="text-[var(--color-accent)]" />
            <span>
              검색어 <strong>{keyword}</strong> 결과: <strong>{totalElements}</strong>건
            </span>
          </div>
        )}

        {posts.length === 0 ? (
          <EmptyState
            title={keyword ? `${keyword}에 대한 검색 결과가 없습니다.` : '아직 작성된 글이 없습니다.'}
            className="py-20"
          />
        ) : (
          <>
            {activeViewMode === 'grid' ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <Surface className="flex flex-col p-2 shadow-none">
                {posts.map((post) => (
                  <PostListItem key={post.id} post={post} />
                ))}
              </Surface>
            )}

            <div className="mb-2 mt-10 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={page === 0}
                className="rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="이전 페이지"
              >
                <ChevronLeft size={24} />
              </button>

              <span className="text-sm font-medium text-[var(--color-text-muted)]">
                페이지 <span className="font-bold text-[var(--color-text)]">{page + 1}</span> {totalPages > 0 && `/ ${totalPages}`}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={isLast || isPlaceholderData}
                className="rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="다음 페이지"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </>
        )}
      </WindowSurface>
    </div>
  );
}
