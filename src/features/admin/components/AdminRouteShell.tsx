'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/features/auth/store';

const navItems = [
  { href: '/admin', label: '대시보드', exact: true },
  { href: '/admin/posts', label: '게시글' },
  { href: '/admin/comments', label: '댓글' },
  { href: '/admin/categories', label: '카테고리' },
  { href: '/admin/profile', label: '프로필' },
  { href: '/admin/mcp', label: 'MCP 연결' },
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
  const isAdmin = _hasHydrated && Boolean(role?.includes('ADMIN'));

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
        <Loader2 className="animate-spin text-[var(--color-text-subtle)]" size={28} aria-label="불러오는 중" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <div>
        <h1 className="font-pixel text-pixel-m text-[var(--color-text)] md:text-pixel-l">관리자</h1>
        <nav
          className="-mx-4 mt-4 flex overflow-x-auto border-b border-[var(--stroke-muted)] px-4 scrollbar-hide md:mx-0 md:px-0"
          aria-label="관리자 메뉴"
        >
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'relative inline-flex h-12 shrink-0 items-center px-3 text-body2 font-semibold transition-colors',
                  isActive
                    ? 'text-[var(--color-text)] after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-[var(--color-text)]'
                    : 'text-[var(--color-text-subtle)] hover:text-[var(--color-text)]',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}
