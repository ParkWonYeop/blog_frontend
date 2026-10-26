'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { LogOut, PanelLeftClose, PanelLeftOpen, PenLine } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store';
import useLogout from '@/features/auth/useLogout';
import { PRIMARY_NAV } from '@/shared/layout/navigation';
import ThemeToggle from '@/shared/theme/ThemeToggle';

interface AppBarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const ghostClass =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-body2 font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]';

export default function AppBar({ isSidebarCollapsed, onToggleSidebar }: AppBarProps) {
  const pathname = usePathname();
  const { isLoggedIn, role, _hasHydrated } = useAuthStore();
  const handleLogout = useLogout();
  const isAdmin = _hasHydrated && isLoggedIn && Boolean(role?.includes('ADMIN'));

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-[var(--stroke-subtle)] bg-[var(--color-page)]">
      <div className="flex h-full min-w-0 items-center justify-between gap-3 px-4 md:px-3">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            aria-expanded={!isSidebarCollapsed}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] md:inline-flex"
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>

          <Link href="/" className="mr-4 shrink-0 rounded-md px-1 text-title4 font-bold text-[var(--color-text)] md:ml-1">
            WYPark
          </Link>

          <nav aria-label="주요 메뉴" className="hidden items-center gap-0.5 md:flex">
            {PRIMARY_NAV.map((item) => {
              const isActive = item.isActive(pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'inline-flex h-9 items-center rounded-lg px-3 text-body2 font-semibold transition-colors hover:bg-[var(--color-hover)]',
                    isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-subtle)] hover:text-[var(--color-text)]',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 md:flex">
          <ThemeToggle />

          {_hasHydrated && (
            isAdmin ? (
              <>
                <Link href="/admin" className={ghostClass} aria-current={pathname.startsWith('/admin') && !pathname.startsWith('/admin/posts/new') ? 'page' : undefined}>
                  관리자
                </Link>
                <Link
                  href="/admin/posts/new"
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3.5 text-body2 font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-hover)]"
                >
                  <PenLine size={16} />
                  글쓰기
                </Link>
                <button type="button" onClick={handleLogout} aria-label="로그아웃" title="로그아웃" className={clsx(ghostClass, 'w-9 justify-center px-0')}>
                  <LogOut size={17} />
                </button>
              </>
            ) : isLoggedIn ? (
              <button type="button" onClick={handleLogout} className={ghostClass}>
                로그아웃
              </button>
            ) : (
              <>
                <Link href="/login" className={ghostClass}>로그인</Link>
                <Link href="/signup" className={ghostClass}>회원가입</Link>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}
