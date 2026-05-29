'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { Archive, Crown, Home, LogIn, LogOut, PenLine, Settings, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface DesktopDockProps {
  isSidebarCollapsed: boolean;
}

type DockItem = {
  key: string;
  href?: string;
  label: string;
  icon: typeof Home;
  isActive?: (pathname: string) => boolean;
  onClick?: () => void;
};

export default function DesktopDock({ isSidebarCollapsed }: DesktopDockProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, role, logout, _hasHydrated } = useAuthStore();
  const isAdmin = _hasHydrated && isLoggedIn && role?.includes('ADMIN');

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      router.push('/');
    }
  };

  const items: DockItem[] = [
    {
      key: 'home',
      href: '/',
      label: '홈',
      icon: Home,
      isActive: (currentPath) => currentPath === '/',
    },
    {
      key: 'archive',
      href: '/archive',
      label: '아카이브',
      icon: Archive,
      isActive: (currentPath) => currentPath.startsWith('/archive'),
    },
    {
      key: 'chess',
      href: '/play/chess',
      label: '체스',
      icon: Crown,
      isActive: (currentPath) => currentPath.startsWith('/play/chess'),
    },
  ];

  if (_hasHydrated && isAdmin) {
    items.push(
      {
        key: 'admin',
        href: '/admin',
        label: '관리자',
        icon: Settings,
        isActive: (currentPath) => currentPath === '/admin',
      },
      {
        key: 'write',
        href: '/admin/posts/new',
        label: '글쓰기',
        icon: PenLine,
        isActive: (currentPath) => currentPath.startsWith('/admin/posts/new'),
      },
      {
        key: 'logout',
        label: '로그아웃',
        icon: LogOut,
        onClick: handleLogout,
      },
    );
  } else if (_hasHydrated && isLoggedIn) {
    items.push({
      key: 'logout',
      label: '로그아웃',
      icon: LogOut,
      onClick: handleLogout,
    });
  } else if (_hasHydrated) {
    items.push(
      {
        key: 'login',
        href: '/login',
        label: '로그인',
        icon: LogIn,
        isActive: (currentPath) => currentPath.startsWith('/login'),
      },
      {
        key: 'signup',
        href: '/signup',
        label: '회원가입',
        icon: UserPlus,
        isActive: (currentPath) => currentPath.startsWith('/signup'),
      },
    );
  }

  const renderItem = (item: DockItem) => {
    const Icon = item.icon;
    const active = item.isActive?.(pathname) ?? false;
    const itemClass = clsx(
      'group relative flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition duration-150 hover:-translate-y-1 hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)] focus-visible:-translate-y-1 sm:h-12 sm:w-12',
      active && 'bg-[var(--card-bg-strong)] text-[var(--color-accent)] ring-1 ring-[var(--color-accent-soft)]',
    );

    const content = (
      <>
        <Icon size={20} strokeWidth={2.1} />
        <span className="pointer-events-none absolute -top-9 hidden whitespace-nowrap rounded-full border border-[var(--card-border)] bg-[var(--card-bg-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)] opacity-0 shadow-[var(--shadow-control)] backdrop-blur-[18px] transition group-hover:opacity-100 sm:block">
          {item.label}
        </span>
        {active && (
          <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-[var(--color-accent)]" />
        )}
      </>
    );

    if (item.href) {
      return (
        <Link
          key={item.key}
          href={item.href}
          title={item.label}
          aria-label={item.label}
          aria-current={active ? 'page' : undefined}
          className={itemClass}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.key}
        type="button"
        title={item.label}
        aria-label={item.label}
        onClick={item.onClick}
        className={itemClass}
      >
        {content}
      </button>
    );
  };

  return (
    <nav
      aria-label="빠른 실행 Dock"
      className={clsx(
        'fixed bottom-3 left-1/2 z-40 -translate-x-1/2 transition-[left] duration-300 ease-out md:bottom-5',
        isSidebarCollapsed ? 'md:left-[calc(50%+2.5rem)]' : 'md:left-[calc(50%+9rem)]',
      )}
    >
      <div className="flex max-w-[calc(100vw-1rem)] items-end gap-1.5 overflow-x-auto rounded-lg border border-[var(--dock-border)] bg-[var(--dock-bg)] px-2 py-2 shadow-[var(--shadow-dock)] backdrop-blur-[30px] sm:gap-2">
        {items.map(renderItem)}
      </div>
    </nav>
  );
}
