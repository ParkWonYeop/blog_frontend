'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { LogOut, Menu, PenLine, Settings, User, UserPlus, X } from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useAuthStore } from '@/store/authStore';

const getAppTitle = (pathname: string) => {
  if (pathname.startsWith('/admin/posts/new')) return 'Write';
  if (pathname.startsWith('/admin/posts')) return 'Posts';
  if (pathname.startsWith('/admin/comments')) return 'Comments';
  if (pathname.startsWith('/admin/categories')) return 'Categories';
  if (pathname.startsWith('/admin/profile')) return 'Profile';
  if (pathname.startsWith('/admin')) return 'Dashboard';
  if (pathname.startsWith('/archive')) return 'Archive';
  if (pathname.startsWith('/category')) return 'Finder';
  if (pathname.startsWith('/posts')) return 'Reader';
  if (pathname.startsWith('/play/chess')) return 'Chess';
  if (pathname.startsWith('/login')) return 'Login';
  if (pathname.startsWith('/signup')) return 'Signup';
  return 'Desktop';
};

export default function DesktopMenuBar() {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn, role, logout, _hasHydrated } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAdmin = _hasHydrated && role?.includes('ADMIN');

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      closeMenu();
      logout();
      alert('로그아웃 되었습니다.');
      router.push('/');
    }
  };

  const quietActionClass =
    'inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] backdrop-blur-2xl transition hover:bg-[var(--window-bg-strong)] hover:text-[var(--color-text)]';

  const actionLinks = (
    <>
      <ThemeToggle />

      {_hasHydrated && (
        isLoggedIn ? (
          <>
            {isAdmin && (
              <>
                <Link href="/admin" onClick={closeMenu} className={quietActionClass}>
                  <Settings size={15} />
                  <span>관리자</span>
                </Link>
                <Link
                  href="/admin/posts/new"
                  onClick={closeMenu}
                  className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full bg-[var(--color-accent)] px-3 text-sm font-semibold text-white shadow-[var(--shadow-control)] transition hover:bg-[var(--color-accent-hover)]"
                >
                  <PenLine size={15} />
                  <span>글쓰기</span>
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className={clsx(quietActionClass, 'hover:text-red-500')}
            >
              <LogOut size={15} />
              <span>로그아웃</span>
            </button>
          </>
        ) : (
          <>
            <Link href="/login" onClick={closeMenu} className={quietActionClass}>
              <User size={15} />
              <span>로그인</span>
            </Link>
            <Link href="/signup" onClick={closeMenu} className={quietActionClass}>
              <UserPlus size={15} />
              <span>회원가입</span>
            </Link>
          </>
        )
      )}
    </>
  );

  return (
    <div
      ref={menuRef}
      className="fixed left-16 right-3 top-3 z-40 md:left-[19rem] md:right-6"
    >
      <div className="flex h-11 items-center justify-between gap-3 rounded-lg border border-[var(--window-border)] bg-[var(--menubar-bg)] px-3 shadow-[var(--shadow-control)] backdrop-blur-2xl">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="shrink-0 text-sm font-bold text-[var(--color-text)]">
            WYPark OS
          </Link>
          <span className="hidden h-4 w-px bg-[var(--color-line)] sm:block" />
          <span className="truncate text-sm font-semibold text-[var(--color-text-muted)]">
            {getAppTitle(pathname)}
          </span>
          <div className="hidden items-center gap-3 text-xs font-medium text-[var(--color-text-subtle)] lg:flex">
            <span>파일</span>
            <span>편집</span>
            <span>보기</span>
            <span>윈도우</span>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">{actionLinks}</div>

        <button
          type="button"
          aria-label={isMenuOpen ? '상단 메뉴 닫기' : '상단 메뉴 열기'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((previous) => !previous)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-control)] text-[var(--color-text)] shadow-[var(--shadow-control)] transition hover:bg-[var(--window-bg-strong)] md:hidden"
        >
          {isMenuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </div>

      <div
        className={clsx(
          'absolute right-0 top-[3.25rem] flex min-w-64 flex-col gap-2 rounded-lg border border-[var(--window-border)] bg-[var(--window-bg-strong)] p-3 shadow-[var(--shadow-window)] backdrop-blur-2xl transition md:hidden',
          isMenuOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
        )}
      >
        {actionLinks}
      </div>
    </div>
  );
}
