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
  pathname: string;
}

const defaultProfile: Profile = {
  name: 'Dev Park',
  bio: '풀스택을 꿈꾸는 개발자\n"코드로 세상을 바꾸고 싶은 박개발의 기술 블로그입니다."',
  imageUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
  githubUrl: 'https://github.com',
  email: 'user@example.com',
};

const sortCategories = (categories: Category[] = []) => {
  return [...categories].sort((a, b) => a.id - b.id);
};

function CategoryItem({ category, depth, pathname }: CategoryItemProps) {
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
          'flex items-center justify-between rounded-lg px-4 py-2 text-sm transition-all',
          isActive ? 'bg-blue-50 font-medium text-blue-600' : 'text-gray-600 hover:bg-gray-50',
        )}
        style={{ marginLeft: `${depth * 10}px` }}
      >
        <Link href={`/category/${category.name}`} className="flex min-w-0 flex-1 items-center gap-2.5">
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
            className="ml-1 rounded-full p-1 transition-colors hover:bg-gray-200/50"
            aria-label={isChildrenVisible ? `${category.name} 접기` : `${category.name} 펼치기`}
          >
            <ChevronRight
              size={14}
              className={clsx('text-gray-400 transition-transform duration-200', isChildrenVisible && 'rotate-90')}
            />
          </button>
        )}
      </div>

      {isChildrenVisible && hasChildren && (
        <div className="ml-4 border-l-2 border-gray-100">
          {sortedChildren.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              depth={depth + 1}
              pathname={pathname}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent() {
  const [isOpen, setIsOpen] = useState(true);

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

  const handleSearch = (newKeyword: string) => {
    const trimmedKeyword = newKeyword.trim();
    if (trimmedKeyword) {
      router.push(`/?keyword=${encodeURIComponent(trimmedKeyword)}`);
      return;
    }

    router.push('/');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="fixed left-4 top-4 z-50 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-gray-100 md:hidden"
        aria-label={isOpen ? '사이드바 닫기' : '사이드바 열기'}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={clsx(
          'fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden border-r border-gray-100 bg-white transition-all duration-300 ease-in-out',
          isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0',
        )}
      >
        <div className={clsx('shrink-0 p-6 text-center transition-opacity duration-200', !isOpen && 'md:hidden md:opacity-0')}>
          <Link href="/" className="block transition-opacity hover:opacity-80">
            <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-gray-200 shadow-inner ring-4 ring-gray-50">
              {isProfileLoading ? (
                <div className="h-full w-full animate-pulse bg-gray-200" />
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
                <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800">{displayProfile.name}</h2>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-500">{displayProfile.bio}</p>
              </>
            )}
          </Link>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col px-4 py-2">
          <div className={clsx('mt-4 flex shrink-0 flex-col items-center gap-4', isOpen && 'hidden')}>
            <Folder size={24} className="text-gray-400" />
          </div>

          <div className={clsx('flex h-full flex-col', !isOpen && 'md:hidden')}>
            <div className="shrink-0 space-y-1">
              <div className="mb-6 mt-2 px-1">
                <PostSearch
                  onSearch={handleSearch}
                  placeholder="검색..."
                  initialKeyword={keyword}
                />
              </div>

              <div className="mb-4">
                <Link
                  href="/archive"
                  className={clsx(
                    'flex items-center gap-2.5 rounded-lg px-4 py-2 text-sm transition-all',
                    pathname === '/archive'
                      ? 'bg-blue-50 font-medium text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  <Archive size={16} />
                  <span>Archives</span>
                </Link>
              </div>

              <div className="mb-4 border-t border-gray-100" />

              <div className="mb-3 flex h-8 items-center justify-between px-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Categories</p>
              </div>
            </div>

            <div className="-mx-2 flex-1 overflow-y-auto px-2 scrollbar-hide">
              {!categories && (
                <div className="space-y-2 px-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-8 animate-pulse rounded bg-gray-100" />
                  ))}
                </div>
              )}

              <div className="mb-6 min-h-[50px] rounded-lg">
                {sortedCategories?.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    depth={0}
                    pathname={pathname}
                  />
                ))}

                <div className="mb-1 mt-2">
                  <Link
                    href="/category/uncategorized"
                    className={clsx(
                      'flex items-center gap-2.5 rounded-lg px-4 py-2 text-sm transition-all',
                      pathname === '/category/uncategorized'
                        ? 'bg-blue-50 font-medium text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50',
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

        <div className={clsx('shrink-0 border-t border-gray-100 bg-white p-6', !isOpen && 'hidden')}>
          <div className="flex justify-center gap-3">
            <a
              href={displayProfile.githubUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-gray-50 p-2.5 text-gray-500 shadow-sm transition-all hover:bg-gray-800 hover:text-white"
              aria-label="Github"
            >
              <Github size={18} />
            </a>
            <a
              href={`mailto:${displayProfile.email}`}
              className="rounded-full bg-gray-50 p-2.5 text-gray-500 shadow-sm transition-all hover:bg-blue-500 hover:text-white"
              aria-label="Email"
            >
              <Mail size={18} />
            </a>
          </div>
          <p className="mt-4 text-center text-[10px] font-light text-gray-300">
            © {new Date().getFullYear()} {displayProfile.name}. All rights reserved.
          </p>
        </div>
      </aside>
    </>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<div className="h-screen w-72 border-r border-gray-100 bg-white" />}>
      <SidebarContent />
    </Suspense>
  );
}
