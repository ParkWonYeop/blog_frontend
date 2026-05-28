'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import {
  Archive,
  ChevronRight,
  FileQuestion,
  Folder,
  FolderOpen,
  Github,
  Mail,
  Menu,
  X,
} from 'lucide-react';
import { getCategories } from '@/api/category';
import { getProfile } from '@/api/profile';
import PostSearch from '@/components/post/PostSearch';
import { Category, Profile } from '@/types';

interface CategoryItemProps {
  category: Category;
  depth: number;
  onNavigate: () => void;
  pathname: string;
}

const defaultProfile: Profile = {
  name: 'Dev Park',
  bio: '개발자',
  imageUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
  githubUrl: 'https://github.com',
  email: 'user@example.com',
};

const sortCategories = (categories: Category[] = []) => {
  return [...categories].sort((a, b) => a.id - b.id);
};

function CategoryItem({ category, depth, onNavigate, pathname }: CategoryItemProps) {
  const sortedChildren = useMemo(() => sortCategories(category.children), [category.children]);
  const hasChildren = sortedChildren.length > 0;
  const isActive = decodeURIComponent(pathname) === `/category/${category.name}`;

  const hasActiveChild = useMemo(() => {
    const check = (categories: Category[] | undefined): boolean => {
      if (!categories) return false;

      return categories.some((child) => {
        return decodeURIComponent(pathname) === `/category/${child.name}` || check(child.children);
      });
    };

    return check(category.children);
  }, [category.children, pathname]);

  const [isExpanded, setIsExpanded] = useState(isActive || hasActiveChild);
  const isChildrenVisible = isExpanded || isActive || hasActiveChild;

  return (
    <div className="mb-1">
      <div
        className={clsx(
          'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all',
          isActive
            ? 'bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]'
            : 'text-[var(--color-text-muted)] hover:bg-black/[0.04] hover:text-[var(--color-text)] dark:hover:bg-white/10',
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
            className="ml-1 rounded-full p-1 transition-colors hover:bg-black/[0.06] dark:hover:bg-white/10"
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

function SidebarContent() {
  const [isOpen, setIsOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get('keyword') || '';

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const sortedCategories = useMemo(() => sortCategories(categories), [categories]);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    retry: 0,
  });

  const displayProfile = profile ? { ...defaultProfile, ...profile } : defaultProfile;

  const closeSidebar = () => setIsOpen(false);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="fixed left-4 top-4 z-50 rounded-full border border-[var(--color-line)] bg-[var(--color-control)] p-2 shadow-[var(--shadow-control)] backdrop-blur-xl transition-colors hover:bg-[var(--color-surface-strong)] md:hidden"
        aria-label={isOpen ? '사이드바 닫기' : '사이드바 열기'}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <button
        type="button"
        aria-label="사이드바 닫기"
        onClick={closeSidebar}
        className={clsx(
          'fixed inset-0 z-30 bg-black/35 backdrop-blur-sm transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={clsx(
          'fixed left-0 top-0 z-40 flex h-screen w-72 flex-col overflow-hidden border-r border-[var(--color-line)] bg-[var(--color-surface-strong)]/96 backdrop-blur-xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="shrink-0 px-6 pb-5 pt-8 text-center">
          <Link href="/" onClick={closeSidebar} className="block transition-opacity hover:opacity-80">
            <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full bg-black/[0.04] shadow-inner ring-1 ring-[var(--color-line)] dark:bg-white/10">
              {isProfileLoading ? (
                <div className="h-full w-full animate-pulse bg-black/[0.06] dark:bg-white/10" />
              ) : (
                <Image
                  src={displayProfile.imageUrl || defaultProfile.imageUrl!}
                  alt="Profile"
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                  priority
                />
              )}
            </div>

            {isProfileLoading ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="h-6 w-24 animate-pulse rounded bg-black/[0.06] dark:bg-white/10" />
                <div className="h-4 w-32 animate-pulse rounded bg-black/[0.04] dark:bg-white/10" />
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold tracking-normal text-[var(--color-text)]">{displayProfile.name}</h2>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-muted)]">{displayProfile.bio}</p>
              </>
            )}
          </Link>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col px-4 py-2">
          <div className="flex h-full flex-col">
            <div className="shrink-0 space-y-1">
              <div id="blog-search" className="mb-5 mt-2 px-1">
                <PostSearch
                  onSearch={handleSearch}
                  placeholder="검색..."
                  initialKeyword={keyword}
                />
              </div>

              <div className="mb-4">
                <Link
                  href="/archive"
                  onClick={closeSidebar}
                  className={clsx(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all',
                    pathname === '/archive'
                      ? 'bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)] hover:bg-black/[0.04] hover:text-[var(--color-text)] dark:hover:bg-white/10',
                  )}
                >
                  <Archive size={16} />
                  <span>아카이브</span>
                </Link>
              </div>

              <div className="mb-4 border-t border-[var(--color-line)]" />

              <div className="mb-3 flex h-8 items-center justify-between px-3">
                <p className="text-xs font-semibold uppercase text-[var(--color-text-subtle)]">카테고리</p>
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
                        : 'text-[var(--color-text-muted)] hover:bg-black/[0.04] hover:text-[var(--color-text)] dark:hover:bg-white/10',
                    )}
                  >
                    <FileQuestion size={16} />
                    <span>미분류</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="shrink-0 border-t border-[var(--color-line)] bg-[var(--color-surface-strong)]/80 p-5">
          <div className="flex justify-center gap-3">
            <a
              href={displayProfile.githubUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--color-line)] bg-[var(--color-control)] p-2.5 text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition-all hover:bg-[var(--color-text)] hover:text-white dark:hover:bg-white dark:hover:text-black"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
            <a
              href={`mailto:${displayProfile.email}`}
              className="rounded-full border border-[var(--color-line)] bg-[var(--color-control)] p-2.5 text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition-all hover:bg-[var(--color-accent)] hover:text-white"
              aria-label="이메일"
            >
              <Mail size={18} />
            </a>
          </div>
          <p className="mt-4 text-center text-[10px] font-light text-[var(--color-text-subtle)]">
            © {new Date().getFullYear()} {displayProfile.name}
          </p>
        </div>
      </aside>
    </>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<div className="h-screen w-72 border-r border-[var(--color-line)] bg-[var(--color-surface-strong)]" />}>
      <SidebarContent />
    </Suspense>
  );
}
