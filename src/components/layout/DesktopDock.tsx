'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  Crown,
  Home,
  LogIn,
  LogOut,
  Menu,
  MoreHorizontal,
  PenLine,
  Pin,
  PinOff,
  Settings,
  UserPlus,
} from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useAuthStore } from '@/store/authStore';

interface DesktopDockProps {
  isSidebarCollapsed: boolean;
  onOpenMobileMenu: () => void;
}

type DockAction = {
  key: string;
  href?: string;
  label: string;
  icon: LucideIcon;
  isActive?: (pathname: string) => boolean;
  onClick?: () => void;
};

const isActivePath = (target: string) => (pathname: string) => {
  if (target === '/') return pathname === '/';
  return pathname.startsWith(target);
};

export default function DesktopDock({ isSidebarCollapsed, onOpenMobileMenu }: DesktopDockProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, role, logout, _hasHydrated } = useAuthStore();
  const [isPinned, setIsPinned] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isAdmin = _hasHydrated && isLoggedIn && role?.includes('ADMIN');

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsPinned(window.localStorage.getItem('dock-pinned') === 'true');
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsMoreOpen(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [pathname]);

  const handlePinnedChange = () => {
    setIsPinned((previous) => {
      const nextValue = !previous;
      window.localStorage.setItem('dock-pinned', String(nextValue));
      return nextValue;
    });
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      setIsMoreOpen(false);
      router.push('/');
    }
  };

  const baseItems: DockAction[] = [
    {
      key: 'home',
      href: '/',
      label: '홈',
      icon: Home,
      isActive: isActivePath('/'),
    },
    {
      key: 'archive',
      href: '/archive',
      label: '아카이브',
      icon: Archive,
      isActive: isActivePath('/archive'),
    },
    {
      key: 'chess',
      href: '/play/chess',
      label: '체스',
      icon: Crown,
      isActive: isActivePath('/play/chess'),
    },
  ];

  const authItems: DockAction[] = [];

  if (_hasHydrated && isAdmin) {
    authItems.push(
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
        isActive: isActivePath('/admin/posts/new'),
      },
      {
        key: 'logout',
        label: '로그아웃',
        icon: LogOut,
        onClick: handleLogout,
      },
    );
  } else if (_hasHydrated && isLoggedIn) {
    authItems.push({
      key: 'logout',
      label: '로그아웃',
      icon: LogOut,
      onClick: handleLogout,
    });
  } else if (_hasHydrated) {
    authItems.push(
      {
        key: 'login',
        href: '/login',
        label: '로그인',
        icon: LogIn,
        isActive: isActivePath('/login'),
      },
      {
        key: 'signup',
        href: '/signup',
        label: '회원가입',
        icon: UserPlus,
        isActive: isActivePath('/signup'),
      },
    );
  }

  const desktopItems = [...baseItems, ...authItems];

  const renderDesktopItem = (item: DockAction) => {
    const Icon = item.icon;
    const active = item.isActive?.(pathname) ?? false;
    const itemClass = clsx(
      'group/item relative flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition duration-150 hover:-translate-y-1 hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)] focus-visible:-translate-y-1',
      active && 'bg-[var(--card-bg-strong)] text-[var(--color-accent)] ring-1 ring-[var(--color-accent-soft)]',
    );

    const content = (
      <>
        <Icon size={20} strokeWidth={2.1} />
        <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-full border border-[var(--card-border)] bg-[var(--card-bg-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)] opacity-0 shadow-[var(--shadow-control)] backdrop-blur-[18px] transition group-hover/item:opacity-100">
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

  const renderMobileItem = (item: DockAction, activeOverride?: boolean) => {
    const Icon = item.icon;
    const active = activeOverride ?? item.isActive?.(pathname) ?? false;
    const itemClass = clsx(
      'flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border border-transparent px-1 text-[10px] font-semibold leading-none text-[var(--color-text-subtle)] transition-colors',
      'hover:bg-[var(--card-bg)] hover:text-[var(--color-text)] focus-visible:bg-[var(--card-bg-strong)]',
      active && 'border-[var(--control-border)] bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-[var(--shadow-control)]',
    );
    const content = (
      <>
        <Icon size={18} strokeWidth={2.1} />
        <span className="max-w-full truncate">{item.label}</span>
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
          onClick={() => setIsMoreOpen(false)}
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
    <>
      <nav
        aria-label="빠른 실행 Dock"
        className={clsx(
          'group fixed bottom-2 left-1/2 z-40 hidden -translate-x-1/2 md:bottom-4 md:block',
          'transition-[left] duration-300 ease-out',
          isSidebarCollapsed ? 'md:left-[calc(50%+2.5rem)]' : 'md:left-[calc(50%+9rem)]',
        )}
      >
        <div
          className={clsx(
            'pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2 transition-opacity',
            isPinned && 'opacity-0',
          )}
          aria-hidden="true"
        >
          <span className="block h-1.5 w-10 rounded-full border border-[var(--dock-border)] bg-[var(--dock-bg)] shadow-[var(--shadow-control)] backdrop-blur-[18px]" />
        </div>

        <div
          className={clsx(
            'flex max-w-[calc(100vw-2rem)] items-end gap-2 overflow-visible rounded-lg border border-[var(--dock-border)] bg-[var(--dock-bg)] px-2 py-2 shadow-[var(--shadow-dock)] backdrop-blur-[30px]',
            'transition-[transform,opacity] duration-300 ease-out',
            !isPinned && 'md:translate-y-[calc(100%-0.875rem)] md:opacity-80 md:hover:translate-y-0 md:hover:opacity-100 md:focus-within:translate-y-0 md:focus-within:opacity-100',
          )}
        >
          {desktopItems.map(renderDesktopItem)}
          <button
            type="button"
            title={isPinned ? 'Dock 고정 해제' : 'Dock 고정'}
            aria-label={isPinned ? 'Dock 고정 해제' : 'Dock 고정'}
            aria-pressed={isPinned}
            onClick={handlePinnedChange}
            className={clsx(
              'group/item relative ml-1 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition duration-150 hover:-translate-y-1 hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]',
              isPinned && 'bg-[var(--card-bg-strong)] text-[var(--color-accent)]',
            )}
          >
            {isPinned ? <PinOff size={19} /> : <Pin size={19} />}
            <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-full border border-[var(--card-border)] bg-[var(--card-bg-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)] opacity-0 shadow-[var(--shadow-control)] backdrop-blur-[18px] transition group-hover/item:opacity-100">
              {isPinned ? '고정 해제' : '고정'}
            </span>
          </button>
        </div>
      </nav>

      {isMoreOpen && (
        <div className="fixed inset-x-2 bottom-[4.75rem] z-50 md:hidden">
          <div className="mx-auto max-w-md rounded-lg border border-[var(--dock-border)] bg-[var(--dock-bg)] p-3 shadow-[var(--shadow-dock)] backdrop-blur-[30px]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-subtle)]">
                설정
              </span>
              <ThemeToggle />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {authItems.map((item) => {
                const Icon = item.icon;
                const active = item.isActive?.(pathname) ?? false;
                const className = clsx(
                  'inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition-colors hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]',
                  active && 'text-[var(--color-accent)]',
                );

                if (item.href) {
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={className}
                      onClick={() => setIsMoreOpen(false)}
                    >
                      <Icon size={16} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={className}
                    onClick={item.onClick}
                  >
                    <Icon size={16} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav aria-label="모바일 Dock" className="fixed inset-x-2 bottom-2 z-40 md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-1 rounded-lg border border-[var(--dock-border)] bg-[var(--dock-bg)] p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-dock)] backdrop-blur-[30px]">
          {renderMobileItem(baseItems[0])}
          {renderMobileItem(baseItems[1])}
          {renderMobileItem({
            key: 'menu',
            label: '메뉴',
            icon: Menu,
            onClick: () => {
              setIsMoreOpen(false);
              onOpenMobileMenu();
            },
          })}
          {renderMobileItem(baseItems[2])}
          {renderMobileItem({
            key: 'more',
            label: '더보기',
            icon: MoreHorizontal,
            onClick: () => setIsMoreOpen((previous) => !previous),
          }, isMoreOpen)}
        </div>
      </nav>
    </>
  );
}
