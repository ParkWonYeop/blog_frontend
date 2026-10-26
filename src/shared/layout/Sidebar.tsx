'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { ChevronRight, X } from 'lucide-react';
import { getCategories } from '@/features/category/api';
import { getProfile } from '@/features/profile/api';
import { getBlogStats } from '@/shared/api/stats';
import PostSearch from '@/features/post/components/PostSearch';
import { sortCategoriesById } from '@/features/category/lib';
import { queryKeys } from '@/shared/lib/queryKeys';
import { decodePathSegment } from '@/shared/lib/paths';
import type { Category, Profile } from '@/shared/types';

interface SidebarProps {
  isDesktopCollapsed: boolean;
  isMobileOpen: boolean;
  onMobileOpenChange: (nextValue: boolean) => void;
}

interface CategoryItemProps {
  category: Category;
  depth: number;
  onNavigate: () => void;
  pathname: string;
}

const defaultProfile: Profile = {
  name: 'Dev Park',
  bio: '개발 기록과 실험을 모아두는 공간입니다.',
  imageUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
  githubUrl: 'https://github.com',
  email: 'user@example.com',
};

const rowClass = 'flex min-h-10 min-w-0 flex-1 items-center rounded-lg px-3 text-body2 transition-colors';

function CategoryItem({ category, depth, onNavigate, pathname }: CategoryItemProps) {
  const sortedChildren = useMemo(() => sortCategoriesById(category.children), [category.children]);
  const hasChildren = sortedChildren.length > 0;
  const decodedPathname = decodePathSegment(pathname);
  const isActive = decodedPathname === `/category/${category.name}`;

  const hasActiveChild = useMemo(() => {
    const check = (categories: Category[] | undefined): boolean => {
      if (!categories) return false;

      return categories.some((child) => {
        return decodedPathname === `/category/${child.name}` || check(child.children);
      });
    };

    return check(category.children);
  }, [category.children, decodedPathname]);

  const [isExpanded, setIsExpanded] = useState(isActive || hasActiveChild);
  const isChildrenVisible = isExpanded || isActive || hasActiveChild;

  return (
    <li>
      <div className="flex items-center gap-0.5" style={{ paddingLeft: `${depth * 12}px` }}>
        <Link
          href={`/category/${category.name}`}
          onClick={onNavigate}
          aria-current={isActive ? 'page' : undefined}
          className={clsx(
            rowClass,
            isActive
              ? 'bg-[var(--color-surface)] font-bold text-[var(--color-text)]'
              : 'font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]',
          )}
        >
          <span className="truncate">{category.name}</span>
        </Link>

        {hasChildren && (
          <button
            type="button"
            onClick={() => setIsExpanded((previous) => !previous)}
            className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-placeholder)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
            aria-label={isChildrenVisible ? `${category.name} 접기` : `${category.name} 펼치기`}
            aria-expanded={isChildrenVisible}
          >
            <ChevronRight size={16} className={clsx('transition-transform', isChildrenVisible && 'rotate-90')} />
          </button>
        )}
      </div>

      {isChildrenVisible && hasChildren && (
        <ul>
          {sortedChildren.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              depth={depth + 1}
              onNavigate={onNavigate}
              pathname={pathname}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function SidebarContent({
  isDesktopCollapsed,
  isMobileOpen,
  onMobileOpenChange,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get('keyword') || '';

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: getCategories,
  });

  const sortedCategories = useMemo(() => sortCategoriesById(categories), [categories]);

  const { data: blogStats } = useQuery({
    queryKey: queryKeys.blogStats.summary,
    queryFn: getBlogStats,
    staleTime: 1000 * 60 * 10,
    retry: 0,
  });

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: getProfile,
    retry: 0,
  });

  const displayProfile = profile ? { ...defaultProfile, ...profile } : defaultProfile;
  const isUncategorized = pathname === '/category/uncategorized';

  const closeSidebar = () => onMobileOpenChange(false);

  useEffect(() => {
    if (!isMobileOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMobileOpenChange(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onMobileOpenChange]);

  const handleSearch = (newKeyword: string) => {
    const trimmedKeyword = newKeyword.trim();
    router.push(trimmedKeyword ? `/?keyword=${encodeURIComponent(trimmedKeyword)}` : '/');
    closeSidebar();
  };

  return (
    <>
      <button
        type="button"
        aria-label="탐색 닫기"
        tabIndex={isMobileOpen ? 0 : -1}
        onClick={closeSidebar}
        className={clsx(
          'fixed inset-0 z-50 bg-[var(--color-overlay)] transition-opacity duration-200 md:hidden',
          isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        aria-label="블로그 탐색"
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[86vw] flex-col bg-[var(--color-page)] transition-transform',
          'md:top-14 md:z-30 md:w-[264px] md:max-w-none md:border-r md:border-[var(--stroke-subtle)]',
          isMobileOpen ? 'translate-x-0 duration-250 ease-enter' : '-translate-x-full duration-200 ease-exit',
          isDesktopCollapsed ? 'md:-translate-x-full' : 'md:translate-x-0',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-5 md:hidden">
          <span className="text-title4 font-bold text-[var(--color-text)]">탐색</span>
          <button
            type="button"
            onClick={closeSidebar}
            aria-label="탐색 닫기"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-hover)]"
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 md:pt-6">
          <Link href="/" onClick={closeSidebar} className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--color-hover)]">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[var(--color-surface)]">
              {!isProfileLoading && (
                <Image
                  src={displayProfile.imageUrl || defaultProfile.imageUrl!}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover"
                  unoptimized
                  priority
                />
              )}
            </div>
            <div className="min-w-0">
              {isProfileLoading ? (
                <div className="h-5 w-20 animate-pulse rounded-md bg-[var(--color-surface)]" />
              ) : (
                <p className="truncate text-body1 font-bold text-[var(--color-text)]">{displayProfile.name}</p>
              )}
            </div>
          </Link>
          {!isProfileLoading && displayProfile.bio && (
            <p className="mt-2 line-clamp-3 whitespace-pre-line px-2 text-body2 text-[var(--color-text-muted)]">{displayProfile.bio}</p>
          )}

          <div id="blog-search" className="mt-5">
            <PostSearch onSearch={handleSearch} placeholder="글 검색" initialKeyword={keyword} shortcutKey="/" />
          </div>

          <nav aria-label="카테고리" className="mt-7">
            <p className="mb-1.5 px-3 text-caption1 font-semibold text-[var(--color-text-subtle)]">카테고리</p>
            {!categories && (
              <div className="space-y-1.5 px-1" aria-hidden="true">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-9 animate-pulse rounded-lg bg-[var(--color-surface)]" />
                ))}
              </div>
            )}
            <ul>
              {sortedCategories?.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  depth={0}
                  onNavigate={closeSidebar}
                  pathname={pathname}
                />
              ))}
              <li>
                <Link
                  href="/category/uncategorized"
                  onClick={closeSidebar}
                  aria-current={isUncategorized ? 'page' : undefined}
                  className={clsx(
                    rowClass,
                    'flex',
                    isUncategorized
                      ? 'bg-[var(--color-surface)] font-bold text-[var(--color-text)]'
                      : 'font-medium text-[var(--color-text-subtle)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]',
                  )}
                >
                  미분류
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="shrink-0 border-t border-[var(--stroke-subtle)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          {blogStats && (
            <dl className="space-y-1 text-body2">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--color-text-subtle)]">이번 달 새 글</dt>
                <dd className="font-semibold tabular-nums text-[var(--color-text)]">{blogStats.monthlyPostCount.toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--color-text-subtle)]">이번 달 조회</dt>
                <dd className="font-semibold tabular-nums text-[var(--color-text)]">{blogStats.monthlyViewCount.toLocaleString()}</dd>
              </div>
            </dl>
          )}
          <div className="mt-3 flex items-center gap-4 text-caption1 text-[var(--color-text-subtle)]">
            {displayProfile.githubUrl && (
              <a href={displayProfile.githubUrl} target="_blank" rel="noreferrer" className="font-semibold hover:text-[var(--color-text)]">GitHub</a>
            )}
            {displayProfile.email && (
              <a href={`mailto:${displayProfile.email}`} className="font-semibold hover:text-[var(--color-text)]">Email</a>
            )}
            <span className="ml-auto">© {new Date().getFullYear()} {displayProfile.name}</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={null}>
      <SidebarContent {...props} />
    </Suspense>
  );
}
