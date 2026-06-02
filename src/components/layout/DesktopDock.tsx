'use client';

import { type CSSProperties, type FocusEvent, useEffect, useRef, useState } from 'react';
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

const DOCK_LEAVE_DELAY_MS = 120;
const DOCK_COLLAPSE_MS = 560;
const DOCK_PINNED_STORAGE_KEY = 'dock-pinned-v2';

type DockToneStyle = CSSProperties & {
  '--dock-item-bg': string;
  '--dock-item-bg-hover': string;
  '--dock-item-bg-active': string;
  '--dock-item-border': string;
  '--dock-item-border-hover': string;
  '--dock-item-fg': string;
  '--dock-item-fg-strong': string;
  '--dock-item-ring': string;
};

const createDockTone = (
  bg: string,
  hover: string,
  active: string,
  border: string,
  borderHover: string,
  fg: string,
  fgStrong: string,
  ring: string,
): DockToneStyle => ({
  '--dock-item-bg': bg,
  '--dock-item-bg-hover': hover,
  '--dock-item-bg-active': active,
  '--dock-item-border': border,
  '--dock-item-border-hover': borderHover,
  '--dock-item-fg': fg,
  '--dock-item-fg-strong': fgStrong,
  '--dock-item-ring': ring,
});

const dockToneStyles: Record<string, DockToneStyle> = {
  home: createDockTone('rgba(215, 246, 231, 0.78)', 'rgba(197, 238, 219, 0.92)', 'rgba(183, 231, 208, 0.96)', 'rgba(66, 178, 126, 0.28)', 'rgba(45, 153, 102, 0.44)', '#287653', '#135c3c', 'rgba(45, 153, 102, 0.26)'),
  archive: createDockTone('rgba(230, 224, 255, 0.78)', 'rgba(218, 210, 250, 0.92)', 'rgba(207, 196, 246, 0.96)', 'rgba(126, 100, 214, 0.28)', 'rgba(105, 78, 190, 0.44)', '#63509b', '#4f3d86', 'rgba(105, 78, 190, 0.24)'),
  chess: createDockTone('rgba(255, 239, 190, 0.82)', 'rgba(255, 231, 161, 0.94)', 'rgba(250, 220, 133, 0.96)', 'rgba(195, 145, 34, 0.28)', 'rgba(170, 119, 18, 0.42)', '#7a5a12', '#654706', 'rgba(170, 119, 18, 0.24)'),
  admin: createDockTone('rgba(211, 236, 255, 0.8)', 'rgba(190, 226, 252, 0.94)', 'rgba(173, 215, 247, 0.96)', 'rgba(62, 145, 205, 0.3)', 'rgba(36, 119, 181, 0.46)', '#2c6f9d', '#155a86', 'rgba(36, 119, 181, 0.25)'),
  write: createDockTone('rgba(255, 225, 207, 0.82)', 'rgba(255, 212, 189, 0.94)', 'rgba(250, 198, 169, 0.96)', 'rgba(205, 110, 68, 0.3)', 'rgba(181, 88, 48, 0.44)', '#995333', '#7d3e20', 'rgba(181, 88, 48, 0.24)'),
  login: createDockTone('rgba(211, 244, 246, 0.8)', 'rgba(190, 234, 238, 0.94)', 'rgba(170, 225, 230, 0.96)', 'rgba(53, 163, 172, 0.3)', 'rgba(28, 136, 146, 0.45)', '#237984', '#12626c', 'rgba(28, 136, 146, 0.24)'),
  signup: createDockTone('rgba(245, 223, 255, 0.8)', 'rgba(238, 207, 252, 0.94)', 'rgba(228, 190, 244, 0.96)', 'rgba(166, 93, 191, 0.3)', 'rgba(139, 68, 166, 0.44)', '#814b93', '#6b347f', 'rgba(139, 68, 166, 0.24)'),
  logout: createDockTone('rgba(255, 224, 229, 0.82)', 'rgba(255, 207, 216, 0.94)', 'rgba(250, 190, 202, 0.96)', 'rgba(204, 82, 98, 0.3)', 'rgba(179, 58, 76, 0.46)', '#9b4250', '#81303d', 'rgba(179, 58, 76, 0.24)'),
  pin: createDockTone('rgba(255, 231, 196, 0.9)', 'rgba(255, 219, 170, 0.98)', 'rgba(250, 204, 137, 1)', 'rgba(205, 132, 48, 0.38)', 'rgba(177, 101, 22, 0.58)', '#90571f', '#713f10', 'rgba(177, 101, 22, 0.3)'),
  menu: createDockTone('rgba(223, 241, 215, 0.82)', 'rgba(207, 231, 197, 0.94)', 'rgba(190, 218, 178, 0.96)', 'rgba(105, 157, 88, 0.3)', 'rgba(82, 134, 66, 0.45)', '#557a43', '#3f6630', 'rgba(82, 134, 66, 0.24)'),
  more: createDockTone('rgba(221, 235, 255, 0.82)', 'rgba(204, 224, 252, 0.94)', 'rgba(185, 211, 245, 0.96)', 'rgba(89, 137, 205, 0.3)', 'rgba(67, 112, 181, 0.45)', '#4f6f9a', '#395a86', 'rgba(67, 112, 181, 0.24)'),
  default: createDockTone('rgba(239, 241, 246, 0.78)', 'rgba(226, 230, 238, 0.94)', 'rgba(214, 220, 232, 0.96)', 'rgba(110, 122, 145, 0.24)', 'rgba(86, 99, 124, 0.38)', '#626d82', '#47566f', 'rgba(86, 99, 124, 0.2)'),
};

const getDockToneStyle = (key: string) => dockToneStyles[key] ?? dockToneStyles.default;

export default function DesktopDock({ isSidebarCollapsed, onOpenMobileMenu }: DesktopDockProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, role, logout, _hasHydrated } = useAuthStore();
  const [isPinned, setIsPinned] = useState(true);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isDockHovered, setIsDockHovered] = useState(false);
  const [isDockFocused, setIsDockFocused] = useState(false);
  const [isDockClosing, setIsDockClosing] = useState(false);
  const dockZoneRef = useRef<HTMLDivElement>(null);
  const dockLeaveTimerRef = useRef<number | null>(null);
  const dockCollapseTimerRef = useRef<number | null>(null);
  const isAdmin = _hasHydrated && isLoggedIn && role?.includes('ADMIN');
  const isDockOpen = isPinned || isDockHovered || isDockFocused;
  const isDockRangeExpanded = isDockOpen || isDockClosing;

  const clearDockTimers = () => {
    if (dockLeaveTimerRef.current !== null) {
      window.clearTimeout(dockLeaveTimerRef.current);
      dockLeaveTimerRef.current = null;
    }

    if (dockCollapseTimerRef.current !== null) {
      window.clearTimeout(dockCollapseTimerRef.current);
      dockCollapseTimerRef.current = null;
    }
  };

  const expandDock = () => {
    clearDockTimers();
    setIsDockClosing(false);
    setIsDockHovered(true);
  };

  const startDockCollapse = () => {
    clearDockTimers();
    setIsDockHovered(false);
    setIsDockClosing(true);
    dockCollapseTimerRef.current = window.setTimeout(() => {
      setIsDockClosing(false);
      dockCollapseTimerRef.current = null;
    }, DOCK_COLLAPSE_MS);
  };

  const scheduleDockCollapse = () => {
    if (isPinned || isDockFocused) return;

    clearDockTimers();
    dockLeaveTimerRef.current = window.setTimeout(() => {
      startDockCollapse();
    }, DOCK_LEAVE_DELAY_MS);
  };

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const savedValue = window.localStorage.getItem(DOCK_PINNED_STORAGE_KEY);
      setIsPinned(savedValue === null ? true : savedValue === 'true');
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsMoreOpen(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [pathname]);

  useEffect(() => {
    return () => clearDockTimers();
  }, []);

  const handlePinnedChange = () => {
    setIsPinned((previous) => {
      const nextValue = !previous;
      window.localStorage.setItem(DOCK_PINNED_STORAGE_KEY, String(nextValue));
      clearDockTimers();
      setIsDockClosing(false);
      setIsDockHovered(!nextValue);
      return nextValue;
    });
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
    const toneStyle = getDockToneStyle(item.key);
    const itemClass = clsx(
      'group/item relative flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--dock-item-border)] bg-[var(--dock-item-bg)] text-[var(--dock-item-fg)] shadow-[var(--shadow-control)] transition duration-150 hover:-translate-y-1 hover:border-[var(--dock-item-border-hover)] hover:bg-[var(--dock-item-bg-hover)] hover:text-[var(--dock-item-fg-strong)] focus-visible:-translate-y-1',
      active && 'border-[var(--dock-item-border-hover)] bg-[var(--dock-item-bg-active)] text-[var(--dock-item-fg-strong)] ring-1 ring-[var(--dock-item-ring)]',
    );

    const content = (
      <>
        <Icon size={20} strokeWidth={2.1} />
        <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-full border border-[var(--card-border)] bg-[var(--card-bg-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)] opacity-0 shadow-[var(--shadow-control)] backdrop-blur-[18px] transition group-hover/item:opacity-100">
          {item.label}
        </span>
        {active && (
          <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-[var(--dock-item-fg-strong)]" />
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
          style={toneStyle}
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
        style={toneStyle}
      >
        {content}
      </button>
    );
  };

  const renderMobileItem = (item: DockAction, activeOverride?: boolean) => {
    const Icon = item.icon;
    const active = activeOverride ?? item.isActive?.(pathname) ?? false;
    const toneStyle = getDockToneStyle(item.key);
    const itemClass = clsx(
      'flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border border-[var(--dock-item-border)] bg-[var(--dock-item-bg)] px-1 text-[10px] font-semibold leading-none text-[var(--dock-item-fg)] shadow-[var(--shadow-control)] transition-colors',
      'hover:border-[var(--dock-item-border-hover)] hover:bg-[var(--dock-item-bg-hover)] hover:text-[var(--dock-item-fg-strong)] focus-visible:bg-[var(--dock-item-bg-active)]',
      active && 'border-[var(--dock-item-border-hover)] bg-[var(--dock-item-bg-active)] text-[var(--dock-item-fg-strong)] ring-1 ring-[var(--dock-item-ring)]',
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
          style={toneStyle}
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
        style={toneStyle}
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
          'fixed bottom-0 left-1/2 z-40 hidden -translate-x-1/2 md:block',
          'transition-[left] duration-300 ease-out',
          isSidebarCollapsed ? 'md:left-[calc(50%+2.5rem)]' : 'md:left-[calc(50%+9rem)]',
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
              : 'h-12 w-16 px-0 pb-0 pt-0',
          )}
        >
          <button
            type="button"
            aria-label="Dock 열기"
            tabIndex={isDockRangeExpanded ? -1 : 0}
            onMouseEnter={expandDock}
            onFocus={handleDockHandleFocus}
            className={clsx(
              'absolute bottom-0 left-1/2 z-10 flex h-9 w-12 -translate-x-1/2 items-start justify-center rounded-t-lg border border-b-0 border-[var(--dock-item-border-hover)] bg-[var(--dock-item-bg-active)] pt-1.5 text-[var(--dock-item-fg-strong)] shadow-[var(--shadow-control)] backdrop-blur-[22px]',
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
              'flex max-w-[calc(100vw-2rem)] origin-bottom items-end gap-2 overflow-visible rounded-lg border border-[var(--dock-border)] bg-[var(--dock-bg)] px-2 py-2 shadow-[var(--shadow-dock)] backdrop-blur-[30px]',
              'transition-[transform,opacity,filter] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
              isDockOpen
                ? 'pointer-events-auto translate-y-0 scale-x-100 scale-y-100 opacity-100 blur-0'
                : clsx(
                    'translate-y-8 scale-x-[0.16] scale-y-[0.22] opacity-0 blur-sm',
                    isDockClosing ? 'pointer-events-auto' : 'pointer-events-none',
                  ),
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
              'group/item relative ml-1 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--dock-item-border-hover)] bg-[var(--dock-item-bg-active)] text-[var(--dock-item-fg-strong)] shadow-[var(--shadow-control)] ring-1 ring-[var(--dock-item-ring)] transition duration-150 hover:-translate-y-1 hover:bg-[var(--dock-item-bg-hover)]',
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
                  'inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-[var(--dock-item-border)] bg-[var(--dock-item-bg)] px-3 text-sm font-semibold text-[var(--dock-item-fg)] shadow-[var(--shadow-control)] transition-colors hover:border-[var(--dock-item-border-hover)] hover:bg-[var(--dock-item-bg-hover)] hover:text-[var(--dock-item-fg-strong)]',
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
