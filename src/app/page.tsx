import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Archive,
  ChevronRight,
  Clock,
  FileText,
  HardDrive,
  Search,
  TrendingUp,
} from 'lucide-react';
import { fetchPublicPosts } from '@/api/publicPosts';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Surface from '@/components/ui/Surface';
import WindowSurface from '@/components/ui/WindowSurface';
import { formatKoreanDate } from '@/lib/dates';
import { getPostSummary, isNoticePost } from '@/lib/posts';
import { DEFAULT_DESCRIPTION, SITE_NAME } from '@/lib/site';
import type { Post, PostListResponse } from '@/types';

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
      title="Spotlight"
      subtitle={`"${keyword}"`}
      bodyClassName="p-0"
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="border-b border-[var(--color-line)] bg-[var(--window-titlebar)] px-4 py-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-[var(--shadow-control)]">
            <Search size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="min-w-0 break-words text-2xl font-bold tracking-normal text-[var(--color-text)]">
              검색 결과
            </h1>
            <p className="break-words text-sm text-[var(--color-text-muted)]">
              검색어 <span className="font-semibold text-[var(--color-text)]">{keyword}</span>에 대한 글 {searchTotalElements.toLocaleString()}건
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {searchResults.length > 0 ? (
          <div className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-2">
            {searchResults.map((post) => (
              <CompactPostRow key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState title="검색 결과가 없습니다." description="다른 키워드로 다시 찾아보세요." />
        )}
      </div>
    </WindowSurface>
  );
}

function NoticeStrip({ notices }: { notices: Post[] }) {
  if (notices.length === 0) return null;

  return (
    <section className="space-y-2" aria-label="공지">
      {notices.slice(0, 3).map((notice) => (
        <Link key={notice.id} href={`/posts/${notice.slug}`} className="group block min-w-0">
          <Surface
            interactive
            className="flex min-w-0 items-center justify-between gap-3 border-red-500/10 bg-red-500/[0.045] px-4 py-3 shadow-none"
          >
            <div className="flex min-w-0 items-center gap-3">
              <StatusBadge tone="danger" className="shrink-0">공지</StatusBadge>
              <span className="min-w-0 truncate text-sm font-semibold text-[var(--color-text)]">
                {notice.title}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-[var(--color-text-subtle)]">
              <time className="hidden sm:inline">{formatKoreanDate(notice.createdAt)}</time>
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
  featured = false,
}: {
  post: Post;
  rank?: number;
  showViews?: boolean;
  featured?: boolean;
}) {
  const summary = getPostSummary(post.content, featured ? 150 : 92);

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={clsxSafe(
        'group flex min-w-0 items-start justify-between gap-3 rounded-lg px-1 py-4 transition duration-150 hover:bg-[var(--card-bg)] hover:px-3',
        featured && 'md:py-5',
      )}
    >
      {rank !== undefined && (
        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-bold tabular-nums text-[var(--color-accent)]">
          {rank}
        </span>
      )}
      {rank === undefined && (
        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-[var(--shadow-control)]">
          <FileText size={17} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex min-w-0 flex-wrap items-center gap-2">
          <StatusBadge tone={isNoticePost(post) ? 'danger' : 'neutral'} className="shrink-0">
            {post.categoryName || '미분류'}
          </StatusBadge>
          <time className="shrink-0 text-xs text-[var(--color-text-subtle)]">
            {formatKoreanDate(post.createdAt)}
          </time>
          {showViews && (
            <span className="shrink-0 text-xs tabular-nums text-[var(--color-text-subtle)]">
              조회 {post.viewCount.toLocaleString()}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 break-words text-base font-semibold text-[var(--color-text)] transition group-hover:text-[var(--color-accent)]">
          {post.title}
        </h3>
        {summary && (
          <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-[var(--color-text-muted)]">
            {summary}
          </p>
        )}
      </div>
      <ChevronRight size={17} className="mt-7 shrink-0 text-[var(--color-text-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
    </Link>
  );
}

function clsxSafe(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function PostListPanel({
  title,
  icon,
  posts,
  isPopular = false,
  featured = false,
}: {
  title: string;
  icon: ReactNode;
  posts: Post[];
  isPopular?: boolean;
  featured?: boolean;
}) {
  return (
    <Surface as="section" strong className="min-w-0 overflow-hidden shadow-none">
      <div className="flex min-h-12 min-w-0 items-center justify-between gap-3 border-b border-[var(--window-titlebar-border)] bg-[var(--window-titlebar)] px-4 py-3 md:px-5">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold text-[var(--color-text)]">
          {icon}
          <span className="truncate">{title}</span>
        </h2>
        <Link href="/archive" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)] transition hover:text-[var(--color-accent)]">
          전체 보기
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="p-4 md:p-6">
        {posts.length > 0 ? (
          <div className="divide-y divide-[var(--color-line)]">
            {posts.map((post, index) => (
              <CompactPostRow
                key={post.id}
                post={post}
                rank={isPopular ? index + 1 : undefined}
                showViews={isPopular}
                featured={featured}
              />
            ))}
          </div>
        ) : (
          <EmptyState title={isPopular ? '인기 글을 집계 중입니다.' : '아직 공개된 글이 없습니다.'} className="min-h-72" />
        )}
      </div>
    </Surface>
  );
}

export default async function Home({ searchParams }: HomePageProps) {
  const keyword = await getSearchKeyword(searchParams);

  if (keyword) {
    const searchData = await fetchPublicPosts({ keyword, size: 20 });

    return (
      <div className="mx-auto min-w-0 max-w-[1180px] px-0 py-3 md:py-6">
        <SearchResults keyword={keyword} data={searchData} />
      </div>
    );
  }

  const [noticesData, latestData, popularData] = await Promise.all([
    fetchPublicPosts({ category: '공지', size: 3, sort: 'createdAt,desc' }),
    fetchPublicPosts({ size: 10, sort: 'createdAt,desc' }),
    fetchPublicPosts({ size: 8, sort: 'viewCount,desc' }),
  ]);

  const notices = noticesData?.content || [];
  const latestList = (latestData?.content || []).filter((post) => !isNoticePost(post)).slice(0, 7);
  const popularList = (popularData?.content || []).filter((post) => !isNoticePost(post)).slice(0, 5);

  return (
    <div className="mx-auto min-w-0 max-w-[1180px] px-0 py-3 md:py-6">
      <h1 className="sr-only">{SITE_NAME}</h1>
      <WindowSurface
        title="WYPark"
        subtitle="블로그 라이브러리"
        controls={(
          <Link
            href="/archive"
            className="inline-flex h-8 min-w-0 items-center gap-2 rounded-full bg-[var(--color-text)] px-3 text-xs font-semibold text-[var(--color-page)] shadow-[var(--shadow-control)] transition hover:opacity-90 dark:bg-white dark:text-black"
          >
            <span className="hidden sm:inline">전체 글</span>
            <Archive size={14} />
          </Link>
        )}
        bodyClassName="space-y-6 p-4 md:p-6"
      >
        <div className="flex min-w-0 flex-col justify-between gap-3 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 md:flex-row md:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-[var(--shadow-control)]">
              <HardDrive size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--color-text)]">최근 기록</p>
              <p className="truncate text-xs text-[var(--color-text-subtle)]">
                최신 글 {latestList.length.toLocaleString()}개 · 인기 글 {popularList.length.toLocaleString()}개
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold tabular-nums text-[var(--color-text-subtle)]">
            {formatKoreanDate(new Date(), { dateStyle: 'medium' })}
          </span>
        </div>

        <NoticeStrip notices={notices} />

        <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
          <PostListPanel
            title="최신 글"
            icon={<Clock size={18} className="shrink-0 text-[var(--color-accent)]" />}
            posts={latestList}
            featured
          />
          <PostListPanel
            title="인기 글"
            icon={<TrendingUp size={18} className="shrink-0 text-[var(--color-accent)]" />}
            posts={popularList}
            isPopular
          />
        </section>
      </WindowSurface>
    </div>
  );
}
