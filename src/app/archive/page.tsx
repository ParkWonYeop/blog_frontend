import type { Metadata } from 'next';
import Link from 'next/link';
import { Archive, Calendar, ChevronRight, FileText } from 'lucide-react';
import {
  fetchPublicPosts,
} from '@/api/publicPosts';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Surface from '@/components/ui/Surface';
import WindowSurface from '@/components/ui/WindowSurface';
import { SITE_NAME } from '@/lib/site';
import { Post, PostListResponse } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Archive',
  alternates: {
    canonical: '/archive',
  },
  openGraph: {
    title: `Archive | ${SITE_NAME}`,
    url: '/archive',
    siteName: SITE_NAME,
    type: 'website',
  },
};

const getTotalElements = (data?: PostListResponse | null) => {
  return data?.page?.totalElements ?? data?.totalElements ?? 0;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const groupPostsByMonth = (posts: Post[]) => {
  const groups: Record<string, Record<string, Post[]>> = {};

  posts.forEach((post) => {
    const date = new Date(post.createdAt);
    if (Number.isNaN(date.getTime())) return;

    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    groups[year] ??= {};
    groups[year][month] ??= [];
    groups[year][month].push(post);
  });

  return groups;
};

const sortPostsNewestFirst = (posts: Post[]) => {
  return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export default async function ArchivePage() {
  const data = await fetchPublicPosts({ page: 0, size: 1000, sort: 'createdAt,desc' });
  const posts = data?.content || [];
  const archiveGroups = groupPostsByMonth(posts);
  const sortedYears = Object.keys(archiveGroups).sort((a, b) => Number(b) - Number(a));
  const totalPosts = getTotalElements(data);

  return (
    <main className="mx-auto w-full px-0 py-4 md:w-[78vw] md:max-w-[1280px] md:py-6">
      <WindowSurface
        title="Archive"
        subtitle={`${totalPosts.toLocaleString()} posts`}
        bodyClassName="p-5 md:p-8"
      >
        <div className="mb-10 border-b border-[var(--color-line)] pb-7 text-center md:text-left">
          <h1 className="mb-3 flex items-center justify-center gap-3 text-3xl font-bold tracking-normal text-[var(--color-text)] md:justify-start">
            <Archive className="text-[var(--color-accent)]" size={32} />
            <span>아카이브</span>
          </h1>
          <p className="text-[var(--color-text-muted)]">
            지금까지 작성한 <span className="font-bold text-[var(--color-accent)]">{totalPosts}</span>개의 글을 시간순으로 정리했습니다.
          </p>
        </div>

        {sortedYears.length > 0 ? (
          <div className="relative space-y-12">
            <div className="absolute bottom-4 left-4 top-4 hidden w-px bg-[var(--color-line)] md:block" />

            {sortedYears.map((year) => {
              const months = archiveGroups[year];
              const sortedMonths = Object.keys(months).sort((a, b) => Number(b) - Number(a));

              return (
                <div key={year} className="relative">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="z-10 hidden h-9 w-9 items-center justify-center rounded-full border-4 border-[var(--window-bg-strong)] bg-[var(--color-accent-soft)] shadow-[var(--shadow-control)] md:flex">
                      <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--color-text)]">{year}</h2>
                  </div>

                  <div className="space-y-8 md:pl-12">
                    {sortedMonths.map((month) => {
                      const monthPosts = months[month];
                      const sortedPosts = sortPostsNewestFirst(monthPosts);

                      return (
                        <div key={month} className="group">
                          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--color-text-muted)]">
                            <Calendar size={18} className="text-[var(--color-text-subtle)]" />
                            {month}월
                            <StatusBadge tone="neutral">{monthPosts.length}</StatusBadge>
                          </h3>

                          <div className="grid gap-3">
                            {sortedPosts.map((post) => (
                              <Link
                                key={post.id}
                                href={`/posts/${post.slug}`}
                                className="group/item block"
                              >
                                <Surface interactive className="flex items-center justify-between gap-4 p-4 shadow-none">
                                  <div className="min-w-0 flex-1">
                                    <h4 className="truncate text-base font-semibold text-[var(--color-text)] transition-colors group-hover/item:text-[var(--color-accent)]">
                                      {post.title}
                                    </h4>
                                    <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--color-text-subtle)]">
                                      <StatusBadge tone="neutral" className="px-1.5 py-0.5">{post.categoryName || '미분류'}</StatusBadge>
                                      <span aria-hidden="true">·</span>
                                      <span className="tabular-nums">
                                        {formatDate(post.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                  <ChevronRight className="text-[var(--color-text-subtle)] transition-colors group-hover/item:text-[var(--color-accent)]" size={20} />
                                </Surface>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="아직 작성한 글이 없습니다."
            icon={<FileText size={48} />}
            className="py-20"
          />
        )}
      </WindowSurface>
    </main>
  );
}
