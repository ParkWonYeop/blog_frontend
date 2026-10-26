'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { ChevronRight, LogIn, LogOut, MoreHorizontal, PenLine, Search, Settings, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store';
import useLogout from '@/features/auth/useLogout';
import { PRIMARY_NAV } from '@/shared/layout/navigation';
import ThemeToggle from '@/shared/theme/ThemeToggle';

interface TabBarProps {
  onOpenExplore: () => void;
}

const tabClass = 'flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] leading-none transition-colors';

function TabContent({ icon: Icon, label, active }: { icon: LucideIcon; label: string; active: boolean }) {
  return (
    <>
      <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
      <span className={active ? 'font-bold' : 'font-medium'}>{label}</span>
    </>
  );
}

function SheetRow({ icon: Icon, label, href, onClick }: { icon: LucideIcon; label: string; href?: string; onClick?: () => void }) {
  const className = 'flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-body1 font-medium text-[var(--color-text)] transition-colors active:bg-[var(--color-pressed)] hover:bg-[var(--color-hover)]';
  const content: ReactNode = (
    <>
      <Icon size={20} className="shrink-0 text-[var(--color-text-subtle)]" />
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      <ChevronRight size={18} className="shrink-0 text-[var(--color-text-placeholder)]" />
    </>
  );

  return href ? (
    <Link href={href} className={className}>{content}</Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>{content}</button>
  );
}

export default function TabBar({ onOpenExplore }: TabBarProps) {
  const pathname = usePathname();
  const { isLoggedIn, role, _hasHydrated } = useAuthStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const handleLogout = useLogout(() => setIsMoreOpen(false));
  const isAdmin = _hasHydrated && isLoggedIn && Boolean(role?.includes('ADMIN'));
  const [home, archive, chess] = PRIMARY_NAV;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setIsMoreOpen(false));
    return () => window.cancelAnimationFrame(frameId);
  }, [pathname]);

  useEffect(() => {
    if (!isMoreOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMoreOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMoreOpen]);

  const renderNavTab = (item: typeof home) => {
    if (!item) return null;
    const active = item.isActive(pathname);

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={clsx(tabClass, active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-subtle)]')}
      >
        <TabContent icon={item.icon} label={item.label} active={active} />
      </Link>
    );
  };

  return (
    <>
      <button
        type="button"
        aria-label="더보기 닫기"
        tabIndex={isMoreOpen ? 0 : -1}
        onClick={() => setIsMoreOpen(false)}
        className={clsx(
          'fixed inset-0 z-50 bg-[var(--color-overlay)] transition-opacity duration-200 md:hidden',
          isMoreOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="더보기"
        inert={!isMoreOpen}
        className={clsx(
          'fixed inset-x-0 bottom-0 z-50 rounded-t-4xl bg-[var(--color-page)] px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow-floating)] transition-transform md:hidden',
          isMoreOpen ? 'translate-y-0 duration-250 ease-enter' : 'translate-y-full duration-200 ease-exit',
        )}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-sm bg-[var(--stroke-weak)]" aria-hidden="true" />
        <p className="px-3 pb-2 text-title4 font-bold text-[var(--color-text)]">더보기</p>

        <div className="flex min-h-14 items-center justify-between gap-3 px-3">
          <span className="text-body1 font-medium text-[var(--color-text)]">화면 테마</span>
          <ThemeToggle />
        </div>

        {_hasHydrated && (
          <div className="mt-1 border-t border-[var(--stroke-subtle)] pt-1">
            {isAdmin ? (
              <>
                <SheetRow icon={Settings} label="관리자" href="/admin" />
                <SheetRow icon={PenLine} label="글쓰기" href="/admin/posts/new" />
                <SheetRow icon={LogOut} label="로그아웃" onClick={handleLogout} />
              </>
            ) : isLoggedIn ? (
              <SheetRow icon={LogOut} label="로그아웃" onClick={handleLogout} />
            ) : (
              <>
                <SheetRow icon={LogIn} label="로그인" href="/login" />
                <SheetRow icon={UserPlus} label="회원가입" href="/signup" />
              </>
            )}
          </div>
        )}
      </div>

      <nav
        aria-label="하단 탭"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--stroke-subtle)] bg-[var(--color-page)] pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto flex h-14 max-w-md items-stretch">
          {renderNavTab(home)}
          {renderNavTab(archive)}
          <button type="button" onClick={onOpenExplore} className={clsx(tabClass, 'text-[var(--color-text-subtle)]')}>
            <TabContent icon={Search} label="탐색" active={false} />
          </button>
          {renderNavTab(chess)}
          <button
            type="button"
            aria-expanded={isMoreOpen}
            onClick={() => setIsMoreOpen((previous) => !previous)}
            className={clsx(tabClass, isMoreOpen ? 'text-[var(--color-text)]' : 'text-[var(--color-text-subtle)]')}
          >
            <TabContent icon={MoreHorizontal} label="더보기" active={isMoreOpen} />
          </button>
        </div>
      </nav>
    </>
  );
}
