import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { fetchPublicPosts } from '@/features/post/publicApi';
import PostListItem from '@/features/post/components/PostListItem';
import SearchPagination from '@/features/post/components/SearchPagination';
import { getSearchPageHref, parseSearchPage, SEARCH_PAGE_SIZE } from '@/features/post/search';
import { getPageMeta } from '@/shared/lib/pagination';
import EmptyState from '@/shared/ui/EmptyState';
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

function SearchResults({
  keyword,
  data,
  page,
}: {
  keyword: string;
  data?: PostListResponse | null;
  page: number;
}) {
  const searchResults = data?.content || [];
  const { totalElements, totalPages } = getPageMeta(data);

  return (
    <div className="mx-auto min-w-0 max-w-[720px]">
      <h1 className="break-words text-title2 font-bold text-[var(--color-text)]">
        ‘{keyword}’ 검색 결과
      </h1>
      {data && (
        <p className="mt-1 text-body2 text-[var(--color-text-subtle)]">
          글 <span className="font-semibold tabular-nums text-[var(--color-text)]">{totalElements.toLocaleString()}</span>개
        </p>
      )}

      <div className="mt-6">
        {!data ? (
          <div className="text-center">
            <EmptyState title="검색 결과를 불러오지 못했어요" description="잠시 후 다시 시도해 주세요" />
            <a href={getSearchPageHref(keyword, page)} className="inline-flex h-10 items-center rounded-lg bg-[var(--color-control)] px-4 text-body2 font-semibold text-[var(--color-text)]">다시 시도</a>
          </div>
        ) : searchResults.length > 0 ? (
          <ul>
            {searchResults.map((post) => (
              <PostListItem key={post.id} post={post} withSummary />
            ))}
          </ul>
        ) : (
          <EmptyState title="검색 결과가 없어요" description="다른 단어로 찾아보세요" />
        )}
        {data && <SearchPagination keyword={keyword} page={page} totalPages={totalPages} />}
      </div>
    </div>
  );
}

function NoticeList({ notices }: { notices: Post[] }) {
  if (notices.length === 0) return null;

  return (
    <section aria-label="공지" className="mb-6 overflow-hidden rounded-2xl border border-[var(--card-border)]">
      {notices.slice(0, 3).map((notice) => (
        <Link
          key={notice.id}
          href={`/posts/${notice.slug}`}
          className="flex min-h-12 min-w-0 items-center gap-3 border-b border-[var(--stroke-subtle)] px-4 transition-colors last:border-b-0 hover:bg-[var(--color-hover)]"
        >
          <span className="shrink-0 text-body2 font-bold text-[var(--color-text)]">공지</span>
          <span className="min-w-0 flex-1 truncate text-body2 text-[var(--color-text-muted)]">{notice.title}</span>
          <ChevronRight size={16} className="shrink-0 text-[var(--color-text-placeholder)]" />
        </Link>
      ))}
    </section>
  );
}

function LatestPost({ post }: { post: Post }) {
  const summary = getPostSummary(post.content, 160);

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group block min-w-0 rounded-4xl bg-[var(--color-inverse)] px-6 pb-8 pt-7 text-[var(--color-on-inverse)] transition-colors hover:bg-[var(--color-accent-hover)] md:px-10 md:pb-12 md:pt-10"
    >
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body2 text-[var(--color-on-inverse-muted)]">
        <span className="font-bold text-[var(--color-on-inverse)]">새로 올라온 글</span>
        <span>{post.categoryName || '미분류'}</span>
        <time dateTime={post.createdAt}>{formatKoreanDate(post.createdAt)}</time>
      </p>
      <h2 className="mt-4 max-w-[24ch] break-words text-title1 font-bold md:text-display">
        {post.title}
      </h2>
      {summary && (
        <p className="mt-4 line-clamp-2 max-w-[56ch] break-words text-body1 text-[var(--color-on-inverse-muted)]">
          {summary}
        </p>
      )}
    </Link>
  );
}

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2 flex min-h-10 items-center justify-between gap-3">
      <h2 className="text-title4 font-bold text-[var(--color-text)]">{title}</h2>
      {action}
    </div>
  );
}

function PopularPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return <EmptyState title="아직 집계된 글이 없어요" className="min-h-48" />;
  }

  return (
    <ol>
      {posts.map((post, index) => (
        <li key={post.id}>
          <Link
            href={`/posts/${post.slug}`}
            className="-mx-2 flex min-w-0 items-start gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-[var(--color-hover)] active:bg-[var(--color-pressed)]"
          >
            <span className="w-6 shrink-0 font-pixel text-pixel-m text-[var(--color-text)]">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 break-words text-body1 font-semibold text-[var(--color-text)]">{post.title}</span>
              <span className="mt-0.5 block text-caption1 tabular-nums text-[var(--color-text-subtle)]">
                조회 {post.viewCount.toLocaleString()}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams ?? {};
  const keyword = (Array.isArray(params.keyword) ? params.keyword[0] : params.keyword) || '';
  const page = parseSearchPage(params.page);

  if (keyword) {
    const searchData = await fetchPublicPosts({ keyword, page: page - 1, size: SEARCH_PAGE_SIZE });
    const totalPages = getPageMeta(searchData).totalPages;
    if (searchData && page > Math.max(1, totalPages)) {
      redirect(getSearchPageHref(keyword, Math.max(1, totalPages)));
    }

    return <SearchResults keyword={keyword} data={searchData} page={page} />;
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
  const recentList = latestList.slice(1, 7);

  return (
    <div className="mx-auto min-w-0 max-w-[1040px]">
      <h1 className="sr-only">{SITE_NAME}</h1>
      <NoticeList notices={notices} />

      {heroPost ? (
        <LatestPost post={heroPost} />
      ) : (
        <EmptyState title="아직 공개된 글이 없어요" className="min-h-48" />
      )}

      <div className="mt-12 grid min-w-0 gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
        <section className="min-w-0">
          <SectionHeader
            title="최근 글"
            action={(
              <Link href="/archive" className="-mr-2 inline-flex h-9 items-center gap-0.5 rounded-lg px-2 text-body2 font-semibold text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]">
                전체 보기
                <ChevronRight size={16} />
              </Link>
            )}
          />
          {recentList.length > 0 ? (
            <ul>
              {recentList.map((post) => (
                <PostListItem key={post.id} post={post} withSummary />
              ))}
            </ul>
          ) : (
            <EmptyState title="아직 공개된 글이 없어요" className="min-h-48" />
          )}
        </section>

        <section className="min-w-0">
          <SectionHeader title="많이 읽은 글" />
          <PopularPosts posts={popularList} />
        </section>
      </div>
    </div>
  );
}
