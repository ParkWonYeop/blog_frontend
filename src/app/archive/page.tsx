'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Link from 'next/link';
import { Archive, Calendar, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { getPosts } from '@/api/posts';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Surface from '@/components/ui/Surface';
import WindowSurface from '@/components/ui/WindowSurface';
import { Post, PostListResponse } from '@/types';

const getTotalElements = (data?: PostListResponse) => {
  return data?.page?.totalElements ?? data?.totalElements ?? 0;
};

export default function ArchivePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['posts', 'all'],
    queryFn: () => getPosts({ page: 0, size: 1000 }),
    staleTime: 1000 * 60 * 5,
  });

  const archiveGroups = useMemo(() => {
    if (!data?.content) return {};

    const groups: { [year: string]: { [month: string]: Post[] } } = {};

    data.content.forEach((post) => {
      const date = new Date(post.createdAt);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      if (!groups[year]) groups[year] = {};
      if (!groups[year][month]) groups[year][month] = [];

      groups[year][month].push(post);
    });

    return groups;
  }, [data]);

  const sortedYears = useMemo(() => {
    return Object.keys(archiveGroups).sort((a, b) => Number(b) - Number(a));
  }, [archiveGroups]);

  const totalPosts = getTotalElements(data);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-accent)]" size={40} />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-1 py-4 md:px-3 md:py-6">
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
                      const posts = months[month];
                      const sortedPosts = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                      return (
                        <div key={month} className="group">
                          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--color-text-muted)]">
                            <Calendar size={18} className="text-[var(--color-text-subtle)]" />
                            {month}월
                            <StatusBadge tone="neutral">{posts.length}</StatusBadge>
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
                                      <span>·</span>
                                      <span className="tabular-nums">
                                        {format(new Date(post.createdAt), 'yyyy.MM.dd')}
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
            title="아직 작성된 기록이 없습니다."
            icon={<FileText size={48} />}
            className="py-20"
          />
        )}
      </WindowSurface>
    </main>
  );
}
