'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Archive, Crown, Home, LogIn, PenLine, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

type DockItem = {
  href: string;
  label: string;
  icon: typeof Home;
  isActive: (pathname: string) => boolean;
};

export default function DesktopDock() {
  const pathname = usePathname();
  const { isLoggedIn, role, _hasHydrated } = useAuthStore();
  const isAdmin = _hasHydrated && isLoggedIn && role?.includes('ADMIN');

  const items: DockItem[] = [
    {
      href: '/',
      label: '홈',
      icon: Home,
      isActive: (currentPath) => currentPath === '/',
    },
    {
      href: '/archive',
      label: '아카이브',
      icon: Archive,
      isActive: (currentPath) => currentPath.startsWith('/archive'),
    },
    {
      href: '/play/chess',
      label: '체스',
      icon: Crown,
      isActive: (currentPath) => currentPath.startsWith('/play/chess'),
    },
  ];

  if (isAdmin) {
    items.push(
      {
        href: '/admin',
        label: '관리자',
        icon: Settings,
        isActive: (currentPath) => currentPath === '/admin',
      },
      {
        href: '/admin/posts/new',
        label: '글쓰기',
        icon: PenLine,
        isActive: (currentPath) => currentPath.startsWith('/admin/posts/new'),
      },
    );
  } else {
    items.push({
      href: '/login',
      label: '로그인',
      icon: LogIn,
      isActive: (currentPath) => currentPath.startsWith('/login'),
    });
  }

  return (
    <nav
      aria-label="빠른 실행 Dock"
      className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 md:bottom-5 md:left-[calc(50%+9rem)]"
    >
      <div className="flex items-end gap-1.5 rounded-lg border border-[var(--window-border)] bg-[var(--dock-bg)] px-2 py-2 shadow-[var(--shadow-window)] backdrop-blur-2xl sm:gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'group relative flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-[var(--color-control)] text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition duration-150 hover:-translate-y-1 hover:bg-[var(--window-bg-strong)] hover:text-[var(--color-text)] focus-visible:-translate-y-1 sm:h-12 sm:w-12',
                active && 'bg-[var(--window-bg-strong)] text-[var(--color-accent)] ring-1 ring-[var(--color-accent-soft)]',
              )}
            >
              <Icon size={21} strokeWidth={2.1} />
              <span className="pointer-events-none absolute -top-9 hidden whitespace-nowrap rounded-full border border-[var(--color-line)] bg-[var(--window-bg-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)] opacity-0 shadow-[var(--shadow-control)] backdrop-blur-xl transition group-hover:opacity-100 sm:block">
                {item.label}
              </span>
              {active && (
                <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-[var(--color-accent)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
