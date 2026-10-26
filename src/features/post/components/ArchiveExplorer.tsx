'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import EmptyState from '@/shared/ui/EmptyState';
import SegmentedControl from '@/shared/ui/SegmentedControl';
import { getPostSummary } from '@/features/post/lib';
import type { Post } from '@/shared/types';

type ArchiveExplorerProps = {
  posts: Post[];
};

type Density = 'comfortable' | 'compact';

const ALL = 'all';

const DENSITY_OPTIONS = [
  { label: '제목만', value: 'compact' },
  { label: '요약까지', value: 'comfortable' },
] as const;

const getPostDate = (post: Post) => {
  const date = new Date(post.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getMonthKey = (date: Date) => {
  return (date.getMonth() + 1).toString().padStart(2, '0');
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
  const withSummary = density === 'comfortable';
  const chipClass = (selected: boolean) => clsx(
    'inline-flex h-9 shrink-0 items-center rounded-md px-3.5 text-body2 font-medium transition-colors',
    selected
      ? 'bg-[var(--color-inverse)] text-[var(--color-on-inverse)]'
      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-text)]',
  );
  const selectClass = 'h-11 min-w-0 flex-1 rounded-xl border px-3 text-body2 font-medium sm:w-36 sm:flex-none';

  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <select aria-label="연도" value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className={selectClass}>
            <option value={ALL}>전체 연도</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
          <select aria-label="월" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className={selectClass}>
            <option value={ALL}>전체 월</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>{Number(month)}월</option>
            ))}
          </select>
        </div>
        <SegmentedControl
          ariaLabel="목록 밀도"
          options={DENSITY_OPTIONS}
          value={density}
          onChange={setDensity}
        />
      </div>

      <div role="group" aria-label="카테고리" className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        <button type="button" aria-pressed={selectedCategory === ALL} onClick={() => setSelectedCategory(ALL)} className={chipClass(selectedCategory === ALL)}>
          전체
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={selectedCategory === category}
            onClick={() => setSelectedCategory(category)}
            className={chipClass(selectedCategory === category)}
          >
            {category}
          </button>
        ))}
      </div>

      {sortedYears.length > 0 ? (
        <div className="mt-10 space-y-12">
          {sortedYears.map((year) => {
            const months = groupedPosts[year] ?? {};
            const sortedMonths = Object.keys(months).sort((a, b) => Number(b) - Number(a));
            const yearCount = sortedMonths.reduce((sum, month) => sum + (months[month]?.length ?? 0), 0);

            return (
              <section key={year} aria-labelledby={`archive-${year}`} className="min-w-0 md:grid md:grid-cols-[140px_minmax(0,1fr)] md:gap-8">
                <div className="mb-4 md:mb-0">
                  <h2 id={`archive-${year}`} className="font-pixel text-pixel-l text-[var(--color-text)] md:sticky md:top-24">
                    {year}
                    <span className="ml-2 font-sans text-body2 font-medium text-[var(--color-text-subtle)]">{yearCount}개</span>
                  </h2>
                </div>

                <div className="min-w-0 space-y-8">
                  {sortedMonths.map((month) => {
                    const monthPosts = months[month] ?? [];

                    return (
                      <div key={month} className="min-w-0">
                        <h3 className="flex items-baseline gap-2 border-b border-[var(--stroke-muted)] pb-2 text-body1 font-bold text-[var(--color-text)]">
                          {Number(month)}월
                          <span className="text-caption1 font-medium tabular-nums text-[var(--color-text-subtle)]">{monthPosts.length}</span>
                        </h3>

                        <ul>
                          {monthPosts.map((post) => {
                            const summary = withSummary ? getPostSummary(post.content, 110) : '';

                            return (
                              <li key={post.id} className="border-b border-[var(--stroke-subtle)] last:border-b-0">
                                <Link
                                  href={`/posts/${post.slug}`}
                                  className="-mx-2 flex min-w-0 items-baseline gap-4 rounded-xl px-2 py-3.5 transition-colors hover:bg-[var(--color-hover)] active:bg-[var(--color-pressed)]"
                                >
                                  <time dateTime={post.createdAt} className="w-8 shrink-0 text-body2 tabular-nums text-[var(--color-text-subtle)]">
                                    {getPostDate(post)?.getDate()}일
                                  </time>
                                  <span className="min-w-0 flex-1">
                                    <span className="block break-words text-body1 font-medium text-[var(--color-text)]">{post.title}</span>
                                    {summary && <span className="mt-1 line-clamp-2 block break-words text-body2 text-[var(--color-text-muted)]">{summary}</span>}
                                  </span>
                                  <span className="hidden shrink-0 text-caption1 text-[var(--color-text-subtle)] sm:block">{post.categoryName || '미분류'}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState title="조건에 맞는 글이 없어요" className="py-20" />
      )}
    </div>
  );
}
