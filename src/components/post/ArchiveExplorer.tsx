'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Calendar, ChevronRight, Rows3, SlidersHorizontal } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Surface from '@/components/ui/Surface';
import { Post } from '@/types';

type ArchiveExplorerProps = {
  posts: Post[];
};

type Density = 'comfortable' | 'compact';

const ALL = 'all';

const getPostDate = (post: Post) => {
  const date = new Date(post.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getMonthKey = (date: Date) => {
  return (date.getMonth() + 1).toString().padStart(2, '0');
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

const sortNewestFirst = (posts: Post[]) => {
  return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export default function ArchiveExplorer({ posts }: ArchiveExplorerProps) {
  const [selectedYear, setSelectedYear] = useState(ALL);
  const [selectedMonth, setSelectedMonth] = useState(ALL);
  const [selectedCategory, setSelectedCategory] = useState(ALL);
  const [density, setDensity] = useState<Density>('compact');

  const years = useMemo(() => {
    return Array.from(new Set(posts.map(getPostDate).filter(Boolean).map((date) => date!.getFullYear().toString())))
      .sort((a, b) => Number(b) - Number(a));
  }, [posts]);

  const monthOptions = useMemo(() => {
    return Array.from(new Set(posts
      .map((post) => {
        const date = getPostDate(post);
        if (!date) return null;
        if (selectedYear !== ALL && date.getFullYear().toString() !== selectedYear) return null;
        return getMonthKey(date);
      })
      .filter(Boolean) as string[]))
      .sort((a, b) => Number(b) - Number(a));
  }, [posts, selectedYear]);

  const categories = useMemo(() => {
    return Array.from(new Set(posts.map((post) => post.categoryName || '미분류'))).sort((a, b) => a.localeCompare(b, 'ko-KR'));
  }, [posts]);

  useEffect(() => {
    if (selectedMonth !== ALL && !monthOptions.includes(selectedMonth)) {
      setSelectedMonth(ALL);
    }
  }, [monthOptions, selectedMonth]);

  const filteredPosts = useMemo(() => {
    return sortNewestFirst(posts.filter((post) => {
      const date = getPostDate(post);
      if (!date) return false;

      const year = date.getFullYear().toString();
      const month = getMonthKey(date);
      const category = post.categoryName || '미분류';

      return (
        (selectedYear === ALL || year === selectedYear)
        && (selectedMonth === ALL || month === selectedMonth)
        && (selectedCategory === ALL || category === selectedCategory)
      );
    }));
  }, [posts, selectedCategory, selectedMonth, selectedYear]);

  const groupedPosts = useMemo(() => {
    const groups: Record<string, Record<string, Post[]>> = {};

    filteredPosts.forEach((post) => {
      const date = getPostDate(post);
      if (!date) return;

      const year = date.getFullYear().toString();
      const month = getMonthKey(date);

      groups[year] ??= {};
      groups[year][month] ??= [];
      groups[year][month].push(post);
    });

    return groups;
  }, [filteredPosts]);

  const sortedYears = Object.keys(groupedPosts).sort((a, b) => Number(b) - Number(a));
  const isCompact = density === 'compact';

  return (
    <div className="min-w-0 space-y-7">
      <Surface className="p-3 shadow-none md:p-4">
        <div className="grid min-w-0 gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
          <label className="min-w-0 text-xs font-bold uppercase tracking-normal text-[var(--color-text-subtle)]">
            연도
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border px-3 text-sm font-semibold normal-case"
            >
              <option value={ALL}>전체 연도</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>

          <label className="min-w-0 text-xs font-bold uppercase tracking-normal text-[var(--color-text-subtle)]">
            월
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border px-3 text-sm font-semibold normal-case"
            >
              <option value={ALL}>전체 월</option>
              {monthOptions.map((month) => (
                <option key={month} value={month}>{Number(month)}월</option>
              ))}
            </select>
          </label>

          <label className="min-w-0 text-xs font-bold uppercase tracking-normal text-[var(--color-text-subtle)]">
            카테고리
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border px-3 text-sm font-semibold normal-case"
            >
              <option value={ALL}>전체 카테고리</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              aria-pressed={isCompact}
              onClick={() => setDensity((previous) => (previous === 'compact' ? 'comfortable' : 'compact'))}
              className={clsx(
                'inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition-colors hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)] md:w-auto',
                isCompact && 'text-[var(--color-accent)]',
              )}
            >
              {isCompact ? <Rows3 size={16} /> : <SlidersHorizontal size={16} />}
              <span>{isCompact ? 'Compact' : 'Comfort'}</span>
            </button>
          </div>
        </div>
      </Surface>

      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[var(--color-line)] pb-4">
        <p className="min-w-0 break-words text-sm font-semibold text-[var(--color-text-muted)]">
          조건에 맞는 글 <span className="text-[var(--color-accent)]">{filteredPosts.length.toLocaleString()}</span>개
        </p>
      </div>

      {sortedYears.length > 0 ? (
        <div className={clsx('relative', isCompact ? 'space-y-8' : 'space-y-12')}>
          <div className="absolute bottom-4 left-4 top-4 hidden w-px bg-[var(--color-line)] md:block" />

          {sortedYears.map((year) => {
            const months = groupedPosts[year];
            const sortedMonths = Object.keys(months).sort((a, b) => Number(b) - Number(a));

            return (
              <div key={year} className="relative min-w-0">
                <div className={clsx('flex items-center gap-4', isCompact ? 'mb-4' : 'mb-6')}>
                  <div className="z-10 hidden h-9 w-9 items-center justify-center rounded-full border-4 border-[var(--window-bg-strong)] bg-[var(--color-accent-soft)] shadow-[var(--shadow-control)] md:flex">
                    <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-text)]">{year}</h2>
                </div>

                <div className={clsx(isCompact ? 'space-y-5 md:pl-12' : 'space-y-8 md:pl-12')}>
                  {sortedMonths.map((month) => {
                    const monthPosts = months[month];

                    return (
                      <div key={month} className="min-w-0">
                        <h3 className={clsx('flex items-center gap-2 font-bold text-[var(--color-text-muted)]', isCompact ? 'mb-2 text-base' : 'mb-4 text-lg')}>
                          <Calendar size={18} className="shrink-0 text-[var(--color-text-subtle)]" />
                          {Number(month)}월
                          <StatusBadge tone="neutral">{monthPosts.length}</StatusBadge>
                        </h3>

                        <div className={clsx('grid min-w-0', isCompact ? 'gap-2' : 'gap-3')}>
                          {monthPosts.map((post) => (
                            <Link
                              key={post.id}
                              href={`/posts/${post.slug}`}
                              className="group/item block min-w-0"
                            >
                              <Surface interactive className={clsx('flex min-w-0 items-center justify-between gap-3 shadow-none', isCompact ? 'p-3' : 'p-4')}>
                                <div className="min-w-0 flex-1">
                                  <h4 className="line-clamp-2 break-words text-sm font-semibold text-[var(--color-text)] transition-colors group-hover/item:text-[var(--color-accent)] md:text-base">
                                    {post.title}
                                  </h4>
                                  <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2 text-xs text-[var(--color-text-subtle)]">
                                    <StatusBadge tone="neutral" className="px-1.5 py-0.5">{post.categoryName || '미분류'}</StatusBadge>
                                    <span className="tabular-nums">
                                      {formatDate(post.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="shrink-0 text-[var(--color-text-subtle)] transition-colors group-hover/item:text-[var(--color-accent)]" size={18} />
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
        <EmptyState title="조건에 맞는 글이 없습니다." className="py-20" />
      )}
    </div>
  );
}
