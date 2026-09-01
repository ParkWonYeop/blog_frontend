'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileQuestion,
  Folder,
  FolderOpen,
} from 'lucide-react';
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
  onDesktopCollapsedChange: (nextValue: boolean) => void;
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
    <div className="mb-1">
      <div
        className={clsx(
          'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all',
          isActive
            ? 'bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)] shadow-sm'
            : 'text-[var(--color-text-muted)] hover:bg-[var(--card-bg)] hover:text-[var(--color-text)]',
        )}
        style={{ marginLeft: `${depth * 8}px` }}
      >
        <Link
          href={`/category/${category.name}`}
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
          {isActive ? <FolderOpen size={16} /> : <Folder size={16} />}
          <span className="truncate">{category.name}</span>
        </Link>

        {hasChildren && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsExpanded((previous) => !previous);
            }}
            className="ml-1 rounded-full p-1 transition-colors hover:bg-[var(--card-bg)]"
            aria-label={isChildrenVisible ? `${category.name} 접기` : `${category.name} 펼치기`}
          >
            <ChevronRight
              size={14}
              className={clsx('text-[var(--color-text-subtle)] transition-transform duration-200', isChildrenVisible && 'rotate-90')}
            />
          </button>
        )}
      </div>

      {isChildrenVisible && hasChildren && (
        <div className="ml-4 border-l border-[var(--color-line)]">
          {sortedChildren.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              depth={depth + 1}
              onNavigate={onNavigate}
              pathname={pathname}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  isDesktopCollapsed,
  isMobileOpen,
  onDesktopCollapsedChange,
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
  const decodedPathname = decodePathSegment(pathname);

  const closeSidebar = () => onMobileOpenChange(false);

  const handleSearch = (newKeyword: string) => {
    const trimmedKeyword = newKeyword.trim();
    if (trimmedKeyword) {
      router.push(`/?keyword=${encodeURIComponent(trimmedKeyword)}`);
      closeSidebar();
      return;
    }

    router.push('/');
    closeSidebar();
  };

  const compactCategoryItems = sortedCategories?.slice(0, 8) ?? [];

  return (
    <>
      <button
        type="button"
        aria-label="사이드바 닫기"
        onClick={closeSidebar}
        className={clsx(
          'fixed inset-0 z-50 bg-black/35 backdrop-blur-sm transition-opacity md:hidden',
          isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={clsx(
          'fixed left-0 top-0 z-[60] flex h-screen w-72 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] shadow-[var(--shadow-sidebar)] backdrop-blur-[30px] transition-[transform,width] duration-300 ease-out md:left-4 md:top-14 md:z-40 md:h-[calc(100vh-9rem)] md:max-w-none md:translate-x-0 md:rounded-lg md:border',
          isDesktopCollapsed ? 'md:w-[4.5rem]' : 'md:w-72',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-[var(--window-titlebar-border)] bg-[var(--window-titlebar)] px-4">
          <div className={clsx('min-w-0', isDesktopCollapsed && 'md:hidden')}>
            <p className="truncate text-sm font-bold text-[var(--color-text)]">라이브러리</p>
            <p className="truncate text-[11px] font-medium text-[var(--color-text-subtle)]">검색과 카테고리</p>
          </div>

          <button
            type="button"
            onClick={() => onDesktopCollapsedChange(!isDesktopCollapsed)}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)] md:flex"
            aria-label={isDesktopCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            {isDesktopCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        <div className={clsx('relative shrink-0', isDesktopCollapsed ? 'px-5 pb-4 pt-5 md:px-3 md:pb-3 md:pt-4' : 'px-5 pb-4 pt-5')}>
          <Link
            href="/"
            onClick={closeSidebar}
            className={clsx(
              'flex min-w-0 items-center gap-3 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-3 transition hover:bg-[var(--card-bg-strong)]',
              isDesktopCollapsed && 'md:justify-center md:border-transparent md:bg-transparent md:p-0 md:hover:bg-transparent',
            )}
          >
            <div
              className={clsx(
                'relative shrink-0 overflow-hidden rounded-lg bg-black/[0.04] shadow-inner ring-1 ring-[var(--color-line)] transition-all dark:bg-white/10',
                isDesktopCollapsed ? 'h-12 w-12' : 'h-12 w-12',
              )}
            >
              {isProfileLoading ? (
                <div className="h-full w-full animate-pulse bg-black/[0.06] dark:bg-white/10" />
              ) : (
                <Image
                  src={displayProfile.imageUrl || defaultProfile.imageUrl!}
                  alt="프로필"
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                  priority
                />
              )}
            </div>

            <div className={clsx('min-w-0 text-left', isDesktopCollapsed && 'md:hidden')}>
              {isProfileLoading ? (
                <div className="space-y-2">
                  <div className="h-6 w-24 animate-pulse rounded bg-black/[0.06] dark:bg-white/10" />
                  <div className="h-4 w-32 animate-pulse rounded bg-black/[0.04] dark:bg-white/10" />
                </div>
              ) : (
                <>
                  <h2 className="truncate text-sm font-bold tracking-normal text-[var(--color-text)]">{displayProfile.name}</h2>
                  <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-xs leading-5 text-[var(--color-text-muted)]">{displayProfile.bio}</p>
                </>
              )}
            </div>
          </Link>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col px-4 py-2">
          <div className={clsx('flex h-full flex-col', isDesktopCollapsed && 'md:hidden')}>
            <div className="shrink-0 space-y-1">
              <div id="blog-search" className="mb-5 mt-2 px-1">
                <PostSearch
                  onSearch={handleSearch}
                  placeholder="검색..."
                  initialKeyword={keyword}
                />
              </div>

              <div className="mb-4 border-t border-[var(--color-line)]" />

              <div className="mb-3 flex h-8 items-center justify-between px-3">
                <p className="text-xs font-semibold uppercase tracking-normal text-[var(--color-text-subtle)]">카테고리</p>
              </div>
            </div>

            <div className="-mx-2 flex-1 overflow-y-auto px-2 scrollbar-hide">
              {!categories && (
                <div className="space-y-2 px-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-8 animate-pulse rounded bg-black/[0.04] dark:bg-white/10" />
                  ))}
                </div>
              )}

              <div className="mb-6 min-h-[50px] rounded-lg">
                {sortedCategories?.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    depth={0}
                    onNavigate={closeSidebar}
                    pathname={pathname}
                  />
                ))}

                <div className="mb-1 mt-2">
                  <Link
                    href="/category/uncategorized"
                    onClick={closeSidebar}
                    className={clsx(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all',
                      pathname === '/category/uncategorized'
                        ? 'bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--card-bg)] hover:text-[var(--color-text)]',
                    )}
                  >
                    <FileQuestion size={16} />
                    <span>미분류</span>
                  </Link>
                </div>
              </div>
            </div>

          </div>

          <div className={clsx('hidden flex-1 flex-col items-center gap-2 overflow-y-auto px-0 pb-4 pt-2 md:flex', !isDesktopCollapsed && 'md:hidden')}>
            {compactCategoryItems.map((category) => {
              const isActive = decodedPathname === `/category/${category.name}`;

              return (
                <Link
                  key={category.id}
                  href={`/category/${category.name}`}
                  title={category.name}
                  aria-label={category.name}
                  className={clsx(
                    'flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--control-border)] bg-[var(--color-control)] text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]',
                    isActive && 'bg-[var(--card-bg-strong)] text-[var(--color-accent)]',
                  )}
                >
                  <Folder size={18} />
                </Link>
              );
            })}

            <Link
              href="/category/uncategorized"
              title="미분류"
              aria-label="미분류"
              className={clsx(
                'flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--control-border)] bg-[var(--color-control)] text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]',
                pathname === '/category/uncategorized' && 'bg-[var(--card-bg-strong)] text-[var(--color-accent)]',
              )}
            >
              <FileQuestion size={18} />
            </Link>
          </div>
        </nav>

        <div
          className={clsx(
            'shrink-0 border-t border-[var(--color-line)] bg-[var(--window-titlebar)] p-5',
            isDesktopCollapsed && 'md:hidden',
          )}
        >
          {blogStats && (
            <div className="mb-4 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-3">
              <p className="mb-1.5 text-[11px] font-bold tracking-wide text-[var(--color-text-subtle)]">이번 달</p>
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span>새 글 {blogStats.monthlyPostCount.toLocaleString()}편</span>
                <span className="tabular-nums">조회 {blogStats.monthlyViewCount.toLocaleString()}</span>
              </div>
            </div>
          )}
          <p className="text-center text-[10px] font-light text-[var(--color-text-subtle)]">
            © {new Date().getFullYear()} {displayProfile.name}
          </p>
        </div>
      </aside>
    </>
  );
}

export default function Sidebar(props: SidebarProps) {
  return (
    <Suspense
      fallback={(
        <div
          className={clsx(
            'h-screen border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]',
            props.isDesktopCollapsed ? 'w-20' : 'w-72',
          )}
        />
      )}
    >
      <SidebarContent {...props} />
    </Suspense>
  );
}
