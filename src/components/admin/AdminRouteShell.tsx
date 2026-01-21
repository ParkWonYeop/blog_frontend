'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { BarChart3, FileText, FolderTree, Loader2, MessageSquareText, UserRound } from 'lucide-react';
import { clsx } from 'clsx';
import WindowSurface from '@/components/ui/WindowSurface';
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
        <Loader2 className="animate-spin text-[var(--color-accent)]" size={36} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-0 py-4 md:py-6">
      <WindowSurface title="System Settings" subtitle="Admin Console" bodyClassName="p-2">
        <nav
          className="flex gap-2 overflow-x-auto rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-1 shadow-[var(--shadow-card)] backdrop-blur-[18px]"
          aria-label="관리자 메뉴"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition',
                  isActive
                    ? 'bg-[var(--card-bg-strong)] text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]',
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </WindowSurface>

      {children}
    </div>
  );
}
