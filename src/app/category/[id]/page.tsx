'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, LayoutGrid, List, Loader2, Search as SearchIcon } from 'lucide-react';
import { getPostsByCategory } from '@/api/posts';
import EmptyState from '@/components/ui/EmptyState';
import PostCard from '@/components/post/PostCard';
import PostListItem from '@/components/post/PostListItem';
import PostSearch from '@/components/post/PostSearch';
import Surface from '@/components/ui/Surface';
import WindowSurface from '@/components/ui/WindowSurface';

const PAGE_SIZE = 10;

const isNoticeCategoryName = (categoryName: string) => {
  return categoryName === '공지' || categoryName === '怨듭?' || categoryName.toLowerCase() === 'notice';
};

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const categoryName = decodeURIComponent(id);
  const apiCategoryName = categoryName === 'uncategorized' ? '미분류' : categoryName;
  const isNoticeCategory = isNoticeCategoryName(apiCategoryName);

  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
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

  const { data: postsData, isLoading, error, isPlaceholderData } = useQuery({
    queryKey: ['posts', 'category', apiCategoryName, page, keyword],
    queryFn: () => getPostsByCategory(apiCategoryName, page, PAGE_SIZE, keyword),
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
      <WindowSurface className="mx-auto max-w-3xl" bodyClassName="px-5 py-10 text-center text-red-500">
        게시글을 불러오는 중 오류가 발생했습니다.
        <br />
        <span className="text-sm text-[var(--color-text-subtle)]">카테고리 이름을 확인해주세요.</span>
      </WindowSurface>
    );
  }

  const posts = postsData?.content || [];
  const pagingData = postsData?.page || postsData;
  const totalElements = pagingData?.totalElements ?? 0;
  const totalPages = pagingData?.totalPages ?? 0;
  const isLast = pagingData?.number !== undefined
    ? pagingData.number + 1 >= pagingData.totalPages
    : (postsData?.last ?? true);

  const handlePrevPage = () => setPage((old) => Math.max(old - 1, 0));
  const handleNextPage = () => {
    if (!isLast) setPage((old) => old + 1);
  };

  return (
    <main className="mx-auto max-w-5xl px-1 py-4 md:px-3 md:py-6">
      <WindowSurface
        title="Finder"
        subtitle={`${apiCategoryName} posts`}
        bodyClassName="p-5 md:p-6"
      >
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--color-line)] pb-5 md:flex-row md:items-center">
          <h1 className="flex shrink-0 items-baseline gap-2 text-2xl font-bold tracking-normal text-[var(--color-text)]">
            {apiCategoryName}
            <span className="text-lg font-normal text-[var(--color-text-subtle)]">글 목록</span>
          </h1>

          <div className="flex w-full items-center gap-3 md:w-auto">
            <PostSearch
              onSearch={handleSearch}
              placeholder={`${apiCategoryName} 내 검색`}
              className="w-full md:w-64"
            />

            <div className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-control)] p-1 shadow-[var(--shadow-control)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className={clsx(
                  'rounded-full p-2 transition-all duration-150',
                  activeViewMode === 'grid'
                    ? 'bg-[var(--window-bg-strong)] text-[var(--color-accent)] shadow-sm'
                    : 'text-[var(--color-text-subtle)] hover:bg-black/[0.04] hover:text-[var(--color-text)] dark:hover:bg-white/10',
                )}
                title="카드형 보기"
                aria-label="카드형 보기"
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
                    ? 'bg-[var(--window-bg-strong)] text-[var(--color-accent)] shadow-sm'
                    : 'text-[var(--color-text-subtle)] hover:bg-black/[0.04] hover:text-[var(--color-text)] dark:hover:bg-white/10',
                )}
                title="리스트형 보기"
                aria-label="리스트형 보기"
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
              <div className="grid gap-6 md:grid-cols-2">
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
                className="rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-white/10"
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
                className="rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-white/10"
                aria-label="다음 페이지"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </>
        )}
      </WindowSurface>
    </main>
  );
}
