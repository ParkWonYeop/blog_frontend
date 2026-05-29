import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Archive,
  ChevronRight,
  Clock,
  Search,
  TrendingUp,
} from 'lucide-react';
import {
  fetchPublicPosts,
} from '@/api/publicPosts';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Surface from '@/components/ui/Surface';
import WindowSurface from '@/components/ui/WindowSurface';
import { DEFAULT_DESCRIPTION, SITE_NAME } from '@/lib/site';
import { Post, PostListResponse } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    absolute: SITE_NAME,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    type: 'website',
  },
};

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const isNoticePost = (post: Post) => {
  const categoryName = post.categoryName || '';
  const normalizedName = categoryName.toLowerCase();

  return categoryName === '공지' || normalizedName === 'notice' || normalizedName === 'announcement';
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

const getTotalElements = (data?: PostListResponse | null) => {
  return data?.page?.totalElements ?? data?.totalElements ?? 0;
};

const getSearchKeyword = async (searchParams?: HomePageProps['searchParams']) => {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const keyword = resolvedSearchParams.keyword;

  return Array.isArray(keyword) ? keyword[0] || '' : keyword || '';
};

function SearchResults({
  keyword,
  data,
}: {
  keyword: string;
  data?: PostListResponse | null;
}) {
  const searchResults = data?.content || [];
  const searchTotalElements = getTotalElements(data);

  return (
    <WindowSurface
      title="Search"
      subtitle={`"${keyword}"`}
      bodyClassName="p-5 md:p-6"
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
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

      {searchResults.length > 0 ? (
        <div className="divide-y divide-[var(--color-line)]">
          {searchResults.map((post) => (
            <CompactPostRow key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState title="검색 결과가 없습니다." description="다른 키워드로 다시 찾아보세요." />
      )}
    </WindowSurface>
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

function CompactPostRow({
  post,
  rank,
  showViews = false,
}: {
  post: Post;
  rank?: number;
  showViews?: boolean;
}) {
  const summary = getSummary(post.content, 92);

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex items-start justify-between gap-4 rounded-lg px-1 py-4 transition duration-150 hover:bg-black/[0.025] hover:px-3 dark:hover:bg-white/[0.07]"
    >
      {rank !== undefined && (
        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-bold tabular-nums text-[var(--color-accent)]">
          {rank}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <StatusBadge tone={isNoticePost(post) ? 'danger' : 'neutral'} className="shrink-0">
            {post.categoryName || '미분류'}
          </StatusBadge>
          <time className="text-xs text-[var(--color-text-subtle)]">
            {formatDate(post.createdAt)}
          </time>
          {showViews && (
            <span className="text-xs tabular-nums text-[var(--color-text-subtle)]">
              조회 {post.viewCount.toLocaleString()}
            </span>
          )}
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

function PostListPanel({
  title,
  icon,
  posts,
  isPopular = false,
}: {
  title: string;
  icon: ReactNode;
  posts: Post[];
  isPopular?: boolean;
}) {
  return (
    <WindowSurface
      as="section"
      showTrafficLights={false}
      className="shadow-none"
      bodyClassName="overflow-hidden"
    >
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-[var(--color-line)] bg-white/[0.16] px-5 py-3 dark:bg-white/[0.04]">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold text-[var(--color-text)]">
          {icon}
          <span className="truncate">{title}</span>
        </h2>
        <Link href="/archive" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)] transition hover:text-[var(--color-accent)]">
          전체 보기
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="p-5 md:p-6">
        {posts.length > 0 ? (
          <div className="divide-y divide-[var(--color-line)]">
            {posts.map((post, index) => (
              <CompactPostRow
                key={post.id}
                post={post}
                rank={isPopular ? index + 1 : undefined}
                showViews={isPopular}
              />
            ))}
          </div>
        ) : (
          <EmptyState title={isPopular ? '인기 글을 집계 중입니다.' : '아직 공개된 글이 없습니다.'} className="min-h-72" />
        )}
      </div>
    </WindowSurface>
  );
}

export default async function Home({ searchParams }: HomePageProps) {
  const keyword = await getSearchKeyword(searchParams);

  if (keyword) {
    const searchData = await fetchPublicPosts({ keyword, size: 20 });

    return (
      <main className="mx-auto w-full px-0 py-4 md:w-[78vw] md:max-w-[1280px] md:py-6">
        <SearchResults keyword={keyword} data={searchData} />
      </main>
    );
  }

  const [noticesData, latestData, popularData] = await Promise.all([
    fetchPublicPosts({ category: '공지', size: 3, sort: 'createdAt,desc' }),
    fetchPublicPosts({ size: 8, sort: 'createdAt,desc' }),
    fetchPublicPosts({ size: 8, sort: 'viewCount,desc' }),
  ]);

  const notices = noticesData?.content || [];
  const latestList = (latestData?.content || []).filter((post) => !isNoticePost(post)).slice(0, 5);
  const popularList = (popularData?.content || []).filter((post) => !isNoticePost(post)).slice(0, 5);

  return (
    <main className="mx-auto w-full px-0 py-4 md:w-[78vw] md:max-w-[1280px] md:py-6">
      <h1 className="sr-only">{SITE_NAME}</h1>
      <WindowSurface
        title="WYPark"
        controls={(
          <Link
            href="/archive"
            className="inline-flex h-8 items-center gap-2 rounded-full bg-[var(--color-text)] px-3 text-xs font-semibold text-[var(--color-page)] shadow-[var(--shadow-control)] transition hover:opacity-90 dark:bg-white dark:text-black"
          >
            전체 글
            <Archive size={14} />
          </Link>
        )}
        bodyClassName="space-y-6 p-4 md:p-6"
      >
        <NoticeStrip notices={notices} />

        <section className="grid gap-6 lg:grid-cols-2">
          <PostListPanel
            title="인기 글"
            icon={<TrendingUp size={18} className="text-[var(--color-accent)]" />}
            posts={popularList}
            isPopular
          />
          <PostListPanel
            title="최신 글"
            icon={<Clock size={18} className="text-[var(--color-accent)]" />}
            posts={latestList}
          />
        </section>
      </WindowSurface>
    </main>
  );
}
