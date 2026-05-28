'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Archive,
  ChevronRight,
  Clock,
  Loader2,
  Search,
} from 'lucide-react';
import { getPosts } from '@/api/posts';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Surface from '@/components/ui/Surface';
import { Post, PostListResponse } from '@/types';

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
  if (!content) return '';

  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#*`_~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
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
            className="flex items-center justify-between gap-4 border-red-500/10 bg-red-500/[0.045] px-4 py-3 shadow-none"
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
      <Surface as="section" strong className="flex min-h-72 items-center justify-center p-6 shadow-none">
        <EmptyState title="아직 공개된 글이 없습니다." />
      </Surface>
    );
  }

  const summary = getSummary(post.content, 170);

  return (
    <Link href={`/posts/${post.slug}`} className="group block h-full">
      <Surface as="article" strong interactive className="flex h-full min-h-72 flex-col p-7 shadow-none md:p-9">
        <div className="mb-6 flex items-center justify-between gap-3">
          <StatusBadge tone="neutral">{post.categoryName || '미분류'}</StatusBadge>
          <time className="text-xs font-medium tabular-nums text-[var(--color-text-subtle)]">
            {formatDate(post.createdAt)}
          </time>
        </div>
        <div className="flex flex-1 flex-col">
          <p className="mb-4 text-sm font-semibold text-[var(--color-accent)]">대표 글</p>
          <h2 className="text-3xl font-bold leading-tight tracking-normal text-[var(--color-text)] md:text-4xl">
            {post.title}
          </h2>
          {summary && (
            <p className="mt-5 line-clamp-3 text-[15px] leading-7 text-[var(--color-text-muted)]">
              {summary}
            </p>
          )}
        </div>
      </Surface>
    </Link>
  );
}

function CompactPostRow({ post }: { post: Post }) {
  const summary = getSummary(post.content, 92);

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex items-start justify-between gap-4 rounded-lg px-1 py-4 transition duration-150 hover:bg-black/[0.025] hover:px-3 dark:hover:bg-white/[0.07]"
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
        {summary && (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {summary}
          </p>
        )}
      </div>
      <ChevronRight size={17} className="mt-7 shrink-0 text-[var(--color-text-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
    </Link>
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
    queryFn: () => getPosts({ size: 7, sort: 'createdAt,desc' }),
    retry: 0,
  });

  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['posts', 'search', keyword],
    queryFn: () => getPosts({ keyword, size: 20 }),
    enabled: !!keyword,
    retry: 0,
  });

  const notices = noticesData?.content || [];
  const latestPosts = (latestData?.content || []).filter((post) => !isNoticePost(post));
  const featuredPost = latestPosts[0];
  const latestList = latestPosts.slice(1, 7);
  const isHomeLoading = !keyword && (isNoticesLoading || isLatestLoading);

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
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 md:px-6 md:py-12">
      <section className="max-w-3xl pt-2 md:pt-8">
        <h1 className="text-4xl font-bold leading-[1.08] tracking-normal text-[var(--color-text)] md:text-6xl">
            박원엽의 개발 기록
        </h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-8 text-[var(--color-text-muted)]">
          배운 것과 운영하며 부딪힌 문제를 짧고 정확하게 남깁니다.
        </p>
        <Link
          href="/archive"
          className="mt-7 inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-text)] px-4 text-sm font-semibold text-[var(--color-page)] shadow-[var(--shadow-control)] transition hover:opacity-90 dark:bg-white dark:text-black"
        >
          전체 글
          <Archive size={16} />
        </Link>
      </section>

      <NoticeStrip notices={notices} />

      <section className={latestList.length > 0 ? 'grid gap-6 lg:grid-cols-[1.1fr_0.9fr]' : 'grid gap-6'}>
        <FeaturedPost post={featuredPost} />

        {latestList.length > 0 && (
          <Surface as="section" className="p-5 shadow-none md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[var(--color-accent)]" />
                <h2 className="text-lg font-bold text-[var(--color-text)]">최신 글</h2>
              </div>
              <Link href="/archive" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-text-muted)] transition hover:text-[var(--color-accent)]">
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
