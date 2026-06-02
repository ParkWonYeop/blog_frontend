'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { getProfile } from '@/api/profile';
import ThemeToggle from '@/components/theme/ThemeToggle';

interface DesktopMenuBarProps {
  isSidebarCollapsed: boolean;
}

const defaultProfile = {
  githubUrl: 'https://github.com',
  email: 'user@example.com',
};

const getCategoryTitle = (pathname: string) => {
  const encodedName = pathname.split('/category/')[1]?.split('/')[0] || '';
  const decodedName = decodeURIComponent(encodedName);
  return decodedName === 'uncategorized' ? '미분류' : decodedName;
};

const getAppTitle = (pathname: string) => {
  if (pathname.startsWith('/admin/posts/new')) return 'Write';
  if (pathname.startsWith('/admin/posts')) return 'Posts';
  if (pathname.startsWith('/admin/comments')) return 'Comments';
  if (pathname.startsWith('/admin/categories')) return 'Categories';
  if (pathname.startsWith('/admin/profile')) return 'Profile';
  if (pathname.startsWith('/admin')) return 'Dashboard';
  if (pathname.startsWith('/archive')) return 'Archive';
  if (pathname.startsWith('/category')) return getCategoryTitle(pathname);
  if (pathname.startsWith('/posts')) return 'Reader';
  if (pathname.startsWith('/play/chess')) return 'Chess';
  if (pathname.startsWith('/login')) return 'Login';
  if (pathname.startsWith('/signup')) return 'Signup';
  return '홈';
};

export default function DesktopMenuBar({ isSidebarCollapsed }: DesktopMenuBarProps) {
  const pathname = usePathname();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    retry: 0,
  });

  const githubUrl = profile?.githubUrl || defaultProfile.githubUrl;
  const email = profile?.email || defaultProfile.email;
  const menuLinkClass = 'text-xs font-semibold text-[var(--color-text-subtle)] transition hover:text-[var(--color-text)]';

  return (
    <div
      className={clsx(
        'fixed right-6 top-3 z-40 hidden transition-[left] duration-300 ease-out md:block',
        isSidebarCollapsed ? 'md:left-24' : 'md:left-[19rem]',
      )}
    >
      <div className="flex h-11 items-center justify-between gap-3 rounded-lg border border-[var(--menubar-border)] bg-[var(--menubar-bg)] px-3 shadow-[var(--shadow-menubar)] backdrop-blur-[24px]">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="shrink-0 text-sm font-bold text-[var(--color-text)]">
            WYPark
          </Link>
          <span className="hidden h-4 w-px bg-[var(--color-line)] sm:block" />
          <span className="truncate text-sm font-semibold text-[var(--color-text-muted)]">
            {getAppTitle(pathname)}
          </span>
          <div className="hidden items-center gap-3 md:flex">
            <a href={githubUrl} target="_blank" rel="noreferrer" className={menuLinkClass}>
              GitHub
            </a>
            <a href={`mailto:${email}`} className={menuLinkClass}>
              Email
            </a>
          </div>
        </div>

        <ThemeToggle />
      </div>
    </div>
  );
}
