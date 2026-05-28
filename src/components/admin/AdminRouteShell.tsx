'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { BarChart3, FileText, FolderTree, Loader2, MessageSquareText, UserRound } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { href: '/admin', label: '대시보드', icon: BarChart3, exact: true },
  { href: '/admin/posts', label: '게시글', icon: FileText },
  { href: '/admin/comments', label: '댓글', icon: MessageSquareText },
  { href: '/admin/categories', label: '카테고리', icon: FolderTree },
  { href: '/admin/profile', label: '프로필', icon: UserRound },
];

const getCurrentPath = (pathname: string) => {
  if (typeof window === 'undefined') return pathname || '/admin';

  return `${window.location.pathname}${window.location.search}`;
};

const getLoginRedirectPath = (pathname: string) => {
  const currentPath = getCurrentPath(pathname);
  return `/login?redirect=${encodeURIComponent(currentPath || '/admin')}`;
};

export default function AdminRouteShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, role, _hasHydrated } = useAuthStore();
  const isAdmin = _hasHydrated && role?.includes('ADMIN');

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isLoggedIn) {
      router.replace(getLoginRedirectPath(pathname));
      return;
    }

    if (!isAdmin) {
      toast.error('관리자 권한이 필요합니다.');
      router.replace('/');
    }
  }, [_hasHydrated, isAdmin, isLoggedIn, pathname, router]);

  if (!_hasHydrated || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={36} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-1 py-4 md:px-4">
      <nav className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-3" aria-label="관리자 메뉴">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                isActive
                  ? 'bg-gray-950 text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950',
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
