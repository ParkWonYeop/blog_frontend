'use client';

import { type FocusEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
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
import { DesktopDockItem, MobileDockItem } from '@/components/layout/desktop-dock/DockItem';
import {
  DOCK_COLLAPSE_MS,
  DOCK_LEAVE_DELAY_MS,
  DOCK_PINNED_STORAGE_KEY,
  isActivePath,
} from '@/components/layout/desktop-dock/config';
import type { DockAction } from '@/components/layout/desktop-dock/config';
import { getDockToneStyle } from '@/components/layout/desktop-dock/styles';
import { useAuthStore } from '@/store/authStore';

interface DesktopDockProps {
  onOpenMobileMenu: () => void;
}

export default function DesktopDock({ onOpenMobileMenu }: DesktopDockProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, role, logout, _hasHydrated } = useAuthStore();
  const [isPinned, setIsPinned] = useState(true);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isDockHovered, setIsDockHovered] = useState(false);
  const [isDockFocused, setIsDockFocused] = useState(false);
  const [isDockClosing, setIsDockClosing] = useState(false);
  const isPinnedRef = useRef(isPinned);
  const dockZoneRef = useRef<HTMLDivElement>(null);
  const dockLeaveTimerRef = useRef<number | null>(null);
  const dockCollapseTimerRef = useRef<number | null>(null);
  const pinToggleStartedByPointerRef = useRef(false);
  const isAdmin = _hasHydrated && isLoggedIn && Boolean(role?.includes('ADMIN'));
  const isDockOpen = isPinned || isDockHovered || isDockFocused;
  const isDockRangeExpanded = isDockOpen || isDockClosing;

  const clearDockTimers = useCallback(() => {
    if (dockLeaveTimerRef.current !== null) {
      window.clearTimeout(dockLeaveTimerRef.current);
      dockLeaveTimerRef.current = null;
    }

    if (dockCollapseTimerRef.current !== null) {
      window.clearTimeout(dockCollapseTimerRef.current);
      dockCollapseTimerRef.current = null;
    }
  }, []);

  const expandDock = () => {
    clearDockTimers();
    setIsDockClosing(false);
    setIsDockHovered(true);
  };

  const startDockCollapse = useCallback(() => {
    clearDockTimers();
    setIsDockHovered(false);
    setIsDockClosing(true);
    dockCollapseTimerRef.current = window.setTimeout(() => {
      setIsDockClosing(false);
      dockCollapseTimerRef.current = null;
    }, DOCK_COLLAPSE_MS);
  }, [clearDockTimers]);

  const scheduleDockCollapse = () => {
    if (isPinned || isDockFocused) return;

    clearDockTimers();
    dockLeaveTimerRef.current = window.setTimeout(() => {
      startDockCollapse();
    }, DOCK_LEAVE_DELAY_MS);
  };

  const blurFocusedDockItem = useCallback(() => {
    if (
      document.activeElement instanceof HTMLElement &&
      dockZoneRef.current?.contains(document.activeElement)
    ) {
      document.activeElement.blur();
    }
  }, []);

  const releaseUnpinnedDockAfterNavigation = useCallback(() => {
    if (isPinnedRef.current) return;

    const isPointerInsideDock = dockZoneRef.current?.matches(':hover') ?? false;

    blurFocusedDockItem();
    setIsDockFocused(false);

    if (isPointerInsideDock) {
      clearDockTimers();
      setIsDockClosing(false);
      setIsDockHovered(true);
      return;
    }

    startDockCollapse();
  }, [blurFocusedDockItem, clearDockTimers, startDockCollapse]);

  useEffect(() => {
    isPinnedRef.current = isPinned;
  }, [isPinned]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const savedValue = window.localStorage.getItem(DOCK_PINNED_STORAGE_KEY);
      const nextValue = savedValue === null ? true : savedValue === 'true';

      isPinnedRef.current = nextValue;
      setIsPinned(nextValue);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsMoreOpen(false);
      releaseUnpinnedDockAfterNavigation();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [pathname, releaseUnpinnedDockAfterNavigation]);

  useEffect(() => {
    return () => clearDockTimers();
  }, [clearDockTimers]);

  const handlePinnedChange = () => {
    const nextValue = !isPinned;
    const startedByPointer = pinToggleStartedByPointerRef.current;
    const isPointerInsideDock = dockZoneRef.current?.matches(':hover') ?? false;

    pinToggleStartedByPointerRef.current = false;
    window.localStorage.setItem(DOCK_PINNED_STORAGE_KEY, String(nextValue));
    clearDockTimers();
    isPinnedRef.current = nextValue;
    setIsPinned(nextValue);

    if (nextValue) {
      setIsDockClosing(false);
      setIsDockHovered(false);
      return;
    }

    if (startedByPointer) {
      setIsDockFocused(false);
      blurFocusedDockItem();
    }

    if (isPointerInsideDock) {
      setIsDockClosing(false);
      setIsDockHovered(true);
      return;
    }

    if (!isDockFocused || startedByPointer) {
      startDockCollapse();
      return;
    }

    setIsDockHovered(false);
    setIsDockClosing(false);
  };

  const handleDockZoneFocus = () => {
    clearDockTimers();
    setIsDockClosing(false);
    setIsDockFocused(true);
  };

  const handleDockHandleFocus = () => {
    handleDockZoneFocus();

    window.requestAnimationFrame(() => {
      dockZoneRef.current
        ?.querySelector<HTMLElement>('[data-dock-panel="true"] a, [data-dock-panel="true"] button')
        ?.focus();
    });
  };

  const handleDockBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;

    if (!nextTarget) {
      window.setTimeout(() => {
        if (dockZoneRef.current?.contains(document.activeElement)) return;

        setIsDockFocused(false);
        if (!isPinned && !isDockHovered) {
          startDockCollapse();
        }
      }, 80);
      return;
    }

    setIsDockFocused(false);
    if (!isPinned && !isDockHovered) {
      startDockCollapse();
    }
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      setIsMoreOpen(false);
      router.push('/');
    }
  };

  const baseItems: [DockAction, DockAction, DockAction] = [
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
      href: '/chess',
      label: '체스',
      icon: Crown,
      isActive: (currentPath) => currentPath.startsWith('/chess') || currentPath.startsWith('/play/chess'),
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

  return (
    <>
      <nav
        aria-label="빠른 실행 Dock"
        className={clsx(
          'fixed bottom-1 left-1/2 z-50 hidden -translate-x-1/2 md:block',
        )}
      >
        <div
          ref={dockZoneRef}
          onMouseEnter={expandDock}
          onMouseLeave={scheduleDockCollapse}
          onFocus={handleDockZoneFocus}
          onBlur={handleDockBlur}
          className={clsx(
            'relative flex items-end justify-center transition-[width,height,padding] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
            isDockRangeExpanded
              ? 'h-32 w-[min(calc(100vw-2rem),56rem)] px-8 pb-7 pt-12'
              : 'h-14 w-16 px-0 pb-0 pt-0',
          )}
        >
          <button
            type="button"
            aria-label="Dock 열기"
            tabIndex={isDockRangeExpanded ? -1 : 0}
            onMouseEnter={expandDock}
            onFocus={handleDockHandleFocus}
            className={clsx(
              'absolute bottom-0 left-1/2 z-10 flex h-10 w-12 -translate-x-1/2 items-start justify-center rounded-t-lg border border-b-0 border-[var(--dock-item-border-hover)] bg-[var(--dock-item-bg-active)] pt-1.5 text-[var(--dock-item-fg-strong)] shadow-[var(--shadow-control)] backdrop-blur-[22px]',
              'transition-[transform,opacity,width,height] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--dock-item-bg-hover)] focus-visible:bg-[var(--dock-item-bg-hover)]',
              isDockRangeExpanded
                ? 'pointer-events-none translate-y-5 scale-75 opacity-0'
                : 'pointer-events-auto translate-y-0 scale-100 opacity-100 hover:h-10 hover:w-14',
            )}
            style={getDockToneStyle('more')}
          >
            <MoreHorizontal size={18} strokeWidth={2.3} />
          </button>

          <div
            data-dock-panel="true"
            className={clsx(
              'flex max-w-[calc(100vw-2rem)] origin-bottom items-end gap-2 overflow-visible rounded-xl border border-[var(--dock-border)] bg-[var(--dock-bg)] px-2 py-2 shadow-[var(--shadow-dock)] backdrop-blur-[30px]',
              'transition-[transform,opacity,filter] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
              isDockOpen
                ? 'pointer-events-auto translate-y-0 scale-x-100 scale-y-100 opacity-100 blur-0'
                : clsx(
                    'translate-y-8 scale-x-[0.16] scale-y-[0.22] opacity-0 blur-sm',
                    isDockClosing ? 'pointer-events-auto' : 'pointer-events-none',
                  ),
            )}
          >
          {desktopItems.map((item) => (
            <DesktopDockItem
              key={item.key}
              item={item}
              pathname={pathname}
              onNavigate={releaseUnpinnedDockAfterNavigation}
            />
          ))}
          <button
            type="button"
            title={isPinned ? 'Dock 고정 해제' : 'Dock 고정'}
            aria-label={isPinned ? 'Dock 고정 해제' : 'Dock 고정'}
            aria-pressed={isPinned}
            onPointerDown={() => {
              pinToggleStartedByPointerRef.current = true;
            }}
            onClick={handlePinnedChange}
            className={clsx(
              'group/item relative ml-1 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--dock-item-border-hover)] bg-[var(--dock-item-bg-active)] text-[var(--dock-item-fg-strong)] shadow-[var(--shadow-control)] ring-1 ring-[var(--dock-item-ring)] backdrop-blur-[18px] transition duration-150 hover:-translate-y-1 hover:bg-[var(--dock-item-bg-hover)]',
              isPinned && 'shadow-[var(--shadow-dock)]',
            )}
            style={getDockToneStyle('pin')}
          >
            {isPinned ? <PinOff size={19} /> : <Pin size={19} />}
            <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-full border border-[var(--card-border)] bg-[var(--card-bg-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)] opacity-0 shadow-[var(--shadow-control)] backdrop-blur-[18px] transition group-hover/item:opacity-100">
              {isPinned ? '고정 해제' : '고정'}
            </span>
          </button>
          </div>
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
                const toneStyle = getDockToneStyle(item.key);
                const className = clsx(
                  'inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-[var(--dock-item-border)] bg-[var(--dock-item-bg)] px-3 text-sm font-semibold text-[var(--dock-item-fg)] shadow-[var(--shadow-control)] backdrop-blur-[18px] transition-colors hover:border-[var(--dock-item-border-hover)] hover:bg-[var(--dock-item-bg-hover)] hover:text-[var(--dock-item-fg-strong)]',
                  active && 'border-[var(--dock-item-border-hover)] bg-[var(--dock-item-bg-active)] text-[var(--dock-item-fg-strong)] ring-1 ring-[var(--dock-item-ring)]',
                );

                if (item.href) {
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={className}
                      style={toneStyle}
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
                    style={toneStyle}
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
          <MobileDockItem item={baseItems[0]} pathname={pathname} onNavigate={() => setIsMoreOpen(false)} />
          <MobileDockItem item={baseItems[1]} pathname={pathname} onNavigate={() => setIsMoreOpen(false)} />
          <MobileDockItem
            pathname={pathname}
            item={{
              key: 'menu',
              label: '메뉴',
              icon: Menu,
              onClick: () => {
                setIsMoreOpen(false);
                onOpenMobileMenu();
              },
            }}
          />
          <MobileDockItem item={baseItems[2]} pathname={pathname} onNavigate={() => setIsMoreOpen(false)} />
          <MobileDockItem
            pathname={pathname}
            activeOverride={isMoreOpen}
            item={{
              key: 'more',
              label: '더보기',
              icon: MoreHorizontal,
              onClick: () => setIsMoreOpen((previous) => !previous),
            }}
          />
        </div>
      </nav>
    </>
  );
}
