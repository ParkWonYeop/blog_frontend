// src/components/layout/TopHeader.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { LogOut, Menu, PenLine, Settings, User, UserPlus, X } from 'lucide-react';
import ThemeToggle from '@/shared/theme/ThemeToggle';

export default function TopHeader() {
  const router = useRouter();
  const { isLoggedIn, role, logout, _hasHydrated } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = _hasHydrated && Boolean(role?.includes('ADMIN'));

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
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
    'flex h-9 shrink-0 items-center gap-2 rounded-full border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] backdrop-blur-[18px] transition-colors hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]';

  return (
    <div
      ref={menuRef}
      className="absolute right-4 top-4 z-30 flex max-w-[calc(100vw-2rem)] items-center justify-end gap-2 md:right-6 md:top-6"
    >
      <div
        className={[
          'flex min-w-0 items-center gap-2 overflow-hidden transition-all duration-300 ease-out',
          isMenuOpen
            ? 'max-w-[calc(100vw-5rem)] translate-x-0 opacity-100'
            : 'pointer-events-none max-w-0 translate-x-3 opacity-0',
        ].join(' ')}
        aria-hidden={!isMenuOpen}
      >
        <div className="flex min-w-max items-center gap-2 rounded-full border border-[var(--control-border)] bg-[var(--card-bg)] p-1.5 shadow-[var(--shadow-control)] backdrop-blur-[18px]">
          <ThemeToggle />

          {_hasHydrated && (
            isLoggedIn ? (
              <>
                {isAdmin && (
                  <>
                    <Link
                      href="/admin"
                      onClick={closeMenu}
                      className={quietActionClass}
                    >
                      <Settings size={16} />
                      <span className="hidden sm:inline">관리자</span>
                    </Link>

                    <Link
                      href="/admin/posts/new"
                      onClick={closeMenu}
                      className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-[var(--color-accent)] px-3 text-sm font-semibold text-white shadow-[var(--shadow-control)] transition-colors hover:bg-[var(--color-accent-hover)]"
                    >
                      <PenLine size={16} />
                      <span>새 글</span>
                    </Link>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-sm font-medium text-[var(--color-text-muted)] shadow-[var(--shadow-control)] backdrop-blur-[18px] transition-colors hover:bg-[var(--card-bg-strong)] hover:text-red-500"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">로그아웃</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-transparent px-2.5 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] sm:px-3"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">로그인</span>
                </Link>

                <Link
                  href="/signup"
                  onClick={closeMenu}
                  className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text)] shadow-[var(--shadow-control)] backdrop-blur-[18px] transition-all hover:bg-[var(--card-bg-strong)]"
                >
                  <UserPlus size={16} />
                  <span className="hidden sm:inline">회원가입</span>
                </Link>
              </>
            )
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label={isMenuOpen ? '상단 메뉴 닫기' : '상단 메뉴 열기'}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((previous) => !previous)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--control-border)] bg-[var(--color-control)] text-[var(--color-text)] shadow-[var(--shadow-control)] backdrop-blur-[18px] transition-colors hover:bg-[var(--card-bg-strong)]"
      >
        {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
    </div>
  );
}
