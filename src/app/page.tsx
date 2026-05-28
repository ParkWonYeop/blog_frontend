'use client';

import { Suspense, useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Archive,
  ChevronRight,
  Clock,
  FolderTree,
  Loader2,
  Search,
  Sparkles,
} from 'lucide-react';
import { getCategories } from '@/api/category';
import { getPosts } from '@/api/posts';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Surface from '@/components/ui/Surface';
import { Category, Post, PostListResponse } from '@/types';

const isNoticePost = (post: Post) => {
  return post.categoryName === '공지' || post.categoryName.toLowerCase() === 'notice';
};

const formatDate = (value?: string) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const getSummary = (content?: string, maxLength = 118) => {
  if (!content) return '아직 요약할 본문이 없습니다. 글을 열어 전체 내용을 확인해 보세요.';

  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#*`_~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
};

const flattenCategories = (categories: Category[] = []): Category[] => {
  return categories.flatMap((category) => [
    category,
    ...flattenCategories(category.children || []),
  ]);
};

const getHomeCategories = (categories: Category[] = []) => {
  return flattenCategories(categories)
    .filter((category) => {
      const name = category.name.toLowerCase();
      return category.name !== '공지' && name !== 'notice' && name !== '미분류';
    })
    .sort((a, b) => a.id - b.id)
    .slice(0, 3);
};

const getTotalElements = (data?: PostListResponse) => {
  return data?.page?.totalElements ?? data?.totalElements ?? 0;
};

function SearchResults({
  keyword,
  data,
  isLoading,
}: {
  keyword: string;
  data?: PostListResponse;
  isLoading: boolean;
}) {
  const searchResults = data?.content || [];
  const searchTotalElements = getTotalElements(data);

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-6 flex flex-col gap-2 border-b border-[var(--color-line)] pb-5">
        <div className="flex items-center gap-2 text-[var(--color-accent)]">
          <Search size={22} />
          <h1 className="text-2xl font-bold tracking-normal text-[var(--color-text)]">
            검색 결과
          </h1>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          검색어 <span className="font-semibold text-[var(--color-text)]">{keyword}</span>에 대한 글 {searchTotalElements.toLocaleString()}건
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-60 items-center justify-center">
          <Loader2 className="animate-spin text-[var(--color-accent)]" size={30} />
        </div>
      ) : searchResults.length > 0 ? (
        <div className="divide-y divide-[var(--color-line)]">
          {searchResults.map((post) => (
            <CompactPostRow key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState title="검색 결과가 없습니다." description="다른 키워드로 다시 찾아보세요." />
      )}
    </section>
  );
}

function NoticeStrip({ notices }: { notices: Post[] }) {
  if (notices.length === 0) return null;

  return (
    <section className="space-y-2" aria-label="공지">
      {notices.slice(0, 3).map((notice) => (
        <Link key={notice.id} href={`/posts/${notice.slug}`} className="group block">
          <Surface
            interactive
            className="flex items-center justify-between gap-4 border-red-500/10 bg-red-500/[0.06] px-4 py-3 shadow-none"
          >
            <div className="flex min-w-0 items-center gap-3">
              <StatusBadge tone="danger">공지</StatusBadge>
              <span className="truncate text-sm font-semibold text-[var(--color-text)]">
                {notice.title}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-[var(--color-text-subtle)]">
              <time>{formatDate(notice.createdAt)}</time>
              <ChevronRight size={15} className="transition group-hover:translate-x-0.5" />
            </div>
          </Surface>
        </Link>
      ))}
    </section>
  );
}

function FeaturedPost({ post }: { post?: Post }) {
  if (!post) {
    return (
      <Surface as="section" strong className="flex min-h-72 items-center justify-center p-6">
        <EmptyState title="대표 글을 기다리고 있습니다." description="새 글이 발행되면 이곳에 먼저 표시됩니다." />
      </Surface>
    );
  }

  return (
    <Link href={`/posts/${post.slug}`} className="group block h-full">
      <Surface as="article" strong interactive className="flex h-full min-h-64 flex-col p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <StatusBadge tone="info">{post.categoryName || '미분류'}</StatusBadge>
          <time className="text-xs font-medium text-[var(--color-text-subtle)]">
            {formatDate(post.createdAt)}
          </time>
        </div>
        <div className="flex flex-1 flex-col">
          <p className="mb-3 text-sm font-semibold text-[var(--color-accent)]">대표 글</p>
          <h2 className="text-2xl font-bold leading-tight tracking-normal text-[var(--color-text)] md:text-3xl">
            {post.title}
          </h2>
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--color-text-muted)]">
            {getSummary(post.content, 160)}
          </p>
          <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)]">
            읽기
            <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </Surface>
    </Link>
  );
}

function CompactPostRow({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex items-start justify-between gap-4 rounded-lg px-3 py-4 transition duration-150 hover:bg-black/[0.03] dark:hover:bg-white/10"
    >
      <div className="min-w-0">
        <div className="mb-1.5 flex items-center gap-2">
          <StatusBadge tone={isNoticePost(post) ? 'danger' : 'neutral'} className="shrink-0">
            {post.categoryName || '미분류'}
          </StatusBadge>
          <time className="text-xs text-[var(--color-text-subtle)]">
            {formatDate(post.createdAt)}
          </time>
        </div>
        <h3 className="line-clamp-1 text-base font-semibold text-[var(--color-text)] transition group-hover:text-[var(--color-accent)]">
          {post.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)]">
          {getSummary(post.content, 96)}
        </p>
      </div>
      <ChevronRight size={18} className="mt-7 shrink-0 text-[var(--color-text-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
    </Link>
  );
}

function CategoryShelf({
  category,
  posts,
  isLoading,
}: {
  category: Category;
  posts: Post[];
  isLoading: boolean;
}) {
  return (
    <Surface as="article" className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-[var(--color-text)]">
            {category.name}
          </h3>
          <p className="mt-1 text-xs text-[var(--color-text-subtle)]">최근 글</p>
        </div>
        <Link
          href={`/category/${category.name}`}
          className="shrink-0 text-xs font-semibold text-[var(--color-accent)]"
        >
          전체 보기
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-10 animate-pulse rounded bg-black/[0.04] dark:bg-white/10" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="divide-y divide-[var(--color-line)]">
          {posts.slice(0, 3).map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              className="group flex items-center justify-between gap-3 py-3"
            >
              <span className="line-clamp-1 text-sm font-semibold text-[var(--color-text-muted)] transition group-hover:text-[var(--color-accent)]">
                {post.title}
              </span>
              <ChevronRight size={15} className="shrink-0 text-[var(--color-text-subtle)]" />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="아직 글이 없습니다." className="min-h-28 py-6" />
      )}
    </Surface>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get('keyword') || '';

  const { data: noticesData, isLoading: isNoticesLoading } = useQuery({
    queryKey: ['posts', 'notices'],
    queryFn: () => getPosts({ category: '공지', size: 3, sort: 'createdAt,desc' }),
    retry: 0,
  });

  const { data: latestData, isLoading: isLatestLoading } = useQuery({
    queryKey: ['posts', 'latest'],
    queryFn: () => getPosts({ size: 8, sort: 'createdAt,desc' }),
    retry: 0,
  });

  const { data: popularData, isLoading: isPopularLoading } = useQuery({
    queryKey: ['posts', 'popular'],
    queryFn: () => getPosts({ size: 5, sort: 'viewCount,desc' }),
    retry: 0,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    retry: 0,
  });

  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['posts', 'search', keyword],
    queryFn: () => getPosts({ keyword, size: 20 }),
    enabled: !!keyword,
    retry: 0,
  });

  const shelfCategories = useMemo(() => getHomeCategories(categories), [categories]);
  const categoryPostQueries = useQueries({
    queries: shelfCategories.map((category) => ({
      queryKey: ['posts', 'category-shelf', category.name],
      queryFn: () => getPosts({ category: category.name, size: 3, sort: 'createdAt,desc' }),
      enabled: !keyword,
      retry: 0,
    })),
  });

  const notices = noticesData?.content || [];
  const latestPosts = (latestData?.content || []).filter((post) => !isNoticePost(post));
  const popularPosts = (popularData?.content || []).filter((post) => !isNoticePost(post));
  const featuredPost = latestPosts[0];
  const latestList = latestPosts.slice(1, 7);
  const isHomeLoading = !keyword && (isNoticesLoading || isLatestLoading || isPopularLoading);

  if (keyword) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <SearchResults keyword={keyword} data={searchData} isLoading={isSearchLoading} />
      </main>
    );
  }

  if (isHomeLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-accent)]" size={36} />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-8 md:px-6">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="max-w-2xl">
          <StatusBadge tone="info" className="mb-5">
            WYPark Blog
          </StatusBadge>
          <h1 className="text-4xl font-bold leading-tight tracking-normal text-[var(--color-text)] md:text-5xl">
            박원엽의 개발 기록
          </h1>
          <p className="mt-5 text-base leading-7 text-[var(--color-text-muted)] md:text-lg">
            백엔드, 네트워크, 운영 경험을 차분하게 정리하는 개인 기술 블로그입니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/archive"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-text)] px-4 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-black"
            >
              전체 글 둘러보기
              <Archive size={16} />
            </Link>
            <Link
              href="#blog-search"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/70 px-4 text-sm font-semibold text-[var(--color-text-muted)] transition hover:bg-white hover:text-[var(--color-text)] dark:bg-white/10"
            >
              검색으로 찾기
              <Search size={16} />
            </Link>
          </div>
        </div>

        <Surface className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">최근 업데이트</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {featuredPost ? formatDate(featuredPost.createdAt) : '새 글을 준비 중입니다.'}
              </p>
            </div>
          </div>
        </Surface>
      </section>

      <NoticeStrip notices={notices} />

      <section className={latestList.length > 0 ? 'grid gap-6 lg:grid-cols-[1.05fr_0.95fr]' : 'grid gap-6'}>
        <FeaturedPost post={featuredPost} />

        {latestList.length > 0 && (
          <Surface as="section" className="p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[var(--color-accent)]" />
                <h2 className="text-lg font-bold text-[var(--color-text)]">최신 글</h2>
              </div>
              <Link href="/archive" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)]">
                전체 보기
                <ChevronRight size={15} />
              </Link>
            </div>

            <div className="divide-y divide-[var(--color-line)]">
              {latestList.map((post) => (
                <CompactPostRow key={post.id} post={post} />
              ))}
            </div>
          </Surface>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-center gap-2">
          <FolderTree size={19} className="text-[var(--color-accent)]" />
          <h2 className="text-xl font-bold text-[var(--color-text)]">카테고리별 글</h2>
        </div>
        {shelfCategories.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {shelfCategories.map((category, index) => (
              <CategoryShelf
                key={category.id}
                category={category}
                posts={categoryPostQueries[index]?.data?.content || []}
                isLoading={categoryPostQueries[index]?.isLoading || false}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="카테고리를 불러오지 못했습니다." description="카테고리 API가 연결되면 이곳에 탐색 선반이 표시됩니다." />
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Surface as="section" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--color-accent)]" />
            <h2 className="text-lg font-bold text-[var(--color-text)]">많이 읽힌 글</h2>
          </div>
          {popularPosts.length > 0 ? (
            <div className="divide-y divide-[var(--color-line)]">
              {popularPosts.slice(0, 4).map((post) => (
                <CompactPostRow key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState title="인기 글을 집계 중입니다." description="조회수 숫자는 공개 홈에서 강조하지 않습니다." />
          )}
        </Surface>

        <Surface as="section" className="flex flex-col justify-between gap-8 p-6">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Archive size={20} />
            </div>
            <h2 className="text-2xl font-bold tracking-normal text-[var(--color-text)]">기록은 아카이브에 쌓입니다.</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
              월별 글 흐름과 지난 글은 아카이브에서 한 번에 살펴볼 수 있습니다.
            </p>
          </div>
          <Link
            href="/archive"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:bg-white dark:bg-white/10"
          >
            아카이브 보기
            <ChevronRight size={16} />
          </Link>
        </Surface>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={(
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-[var(--color-accent)]" size={36} />
        </div>
      )}
    >
      <HomeContent />
    </Suspense>
  );
}
