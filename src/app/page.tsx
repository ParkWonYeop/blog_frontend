import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Archive, ChevronRight, FileText, Search } from 'lucide-react';
import { fetchPublicPosts } from '@/features/post/publicApi';
import EmptyState from '@/shared/ui/EmptyState';
import StatusBadge from '@/shared/ui/StatusBadge';
import Surface from '@/shared/ui/Surface';
import WindowSurface from '@/shared/ui/WindowSurface';
import { formatKoreanDate } from '@/shared/lib/dates';
import { getPostSummary, isNoticePost } from '@/features/post/lib';
import { DEFAULT_DESCRIPTION, SITE_NAME } from '@/shared/lib/site';
import type { Post, PostListResponse } from '@/shared/types';

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

function HeroPost({ post }: { post: Post }) {
  const summary = getPostSummary(post.content, 160);

  return (
    <Link href={`/posts/${post.slug}`} className="group block min-w-0">
      <Surface as="article" strong interactive className="min-w-0 p-6 md:px-7">
        <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2.5">
          <span className="shrink-0 rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-[var(--color-accent)]">
            최신 글
          </span>
          <span className="shrink-0 text-xs font-semibold text-[var(--color-text-muted)]">
            {post.categoryName || '미분류'}
          </span>
          <time className="ml-auto shrink-0 text-xs text-[var(--color-text-subtle)]">
            {formatKoreanDate(post.createdAt)}
          </time>
        </div>
        <h2 className="break-words text-2xl font-extrabold leading-snug tracking-tight text-[var(--color-text)] transition group-hover:text-[var(--color-accent)] md:text-[26px]">
          {post.title}
        </h2>
        {summary && (
          <p className="mt-2.5 max-w-[62ch] break-words text-sm leading-relaxed text-[var(--color-text-muted)]">
            {summary}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)]">
          계속 읽기
          <ChevronRight size={15} className="transition group-hover:translate-x-0.5" />
        </span>
      </Surface>
    </Link>
  );
}

function PostListSection({
  title,
  action,
  posts,
  isPopular = false,
  emptyTitle,
}: {
  title: string;
  action?: ReactNode;
  posts: Post[];
  isPopular?: boolean;
  emptyTitle: string;
}) {
  return (
    <section className="min-w-0">
      <div className="flex items-center justify-between gap-3 px-1 pb-2.5">
        <h2 className="text-sm font-bold text-[var(--color-text)]">{title}</h2>
        {action}
      </div>
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4">
        {posts.length > 0 ? (
          <div className="divide-y divide-[var(--color-line)]">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="group flex min-w-0 items-baseline gap-3 py-3.5"
              >
                {isPopular && (
                  <span className="w-4 shrink-0 text-[13px] font-extrabold tabular-nums text-[var(--color-accent)]">
                    {index + 1}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 break-words text-sm font-semibold text-[var(--color-text)] transition group-hover:text-[var(--color-accent)]">
                    {post.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-subtle)]">
                    {isPopular ? (
                      <span className="tabular-nums">조회 {post.viewCount.toLocaleString()}</span>
                    ) : (
                      <>
                        <span className="font-medium text-[var(--color-text-muted)]">
                          {post.categoryName || '미분류'}
                        </span>
                        <time>{formatKoreanDate(post.createdAt)}</time>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title={emptyTitle} className="min-h-48" />
        )}
      </div>
    </section>
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
  const heroPost = latestList[0];
  const recentList = latestList.slice(1, 6);

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
        <NoticeStrip notices={notices} />

        {heroPost ? (
          <HeroPost post={heroPost} />
        ) : (
          <EmptyState title="아직 공개된 글이 없습니다." className="min-h-48" />
        )}

        <section className="grid min-w-0 gap-6 lg:grid-cols-2">
          <PostListSection
            title="최근 게시글"
            action={(
              <Link href="/archive" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)] transition hover:text-[var(--color-accent)]">
                전체 보기
                <ChevronRight size={14} />
              </Link>
            )}
            posts={recentList}
            emptyTitle="아직 공개된 글이 없습니다."
          />
          <PostListSection
            title="인기 글"
            action={<span className="text-xs text-[var(--color-text-subtle)]">조회수 기준</span>}
            posts={popularList}
            isPopular
            emptyTitle="인기 글을 집계 중입니다."
          />
        </section>
      </WindowSurface>
    </div>
  );
}
