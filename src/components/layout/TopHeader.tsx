// src/components/layout/TopHeader.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LogOut, PenLine, Settings, User, UserPlus } from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';

export default function TopHeader() {
  const router = useRouter();
  const { isLoggedIn, role, logout, _hasHydrated } = useAuthStore();
  const isAdmin = _hasHydrated && role?.includes('ADMIN');

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      alert('로그아웃 되었습니다.');
      router.push('/');
    }
  };

  return (
    <div className="absolute right-4 top-4 z-30 flex max-w-[calc(100vw-5.5rem)] flex-wrap items-center justify-end gap-2 md:right-6 md:top-6 md:max-w-none md:gap-3">
      <ThemeToggle />

      {_hasHydrated && (
        isLoggedIn ? (
          <>
            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className="flex h-10 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] backdrop-blur-2xl transition-colors hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-accent)] sm:px-4"
                >
                  <Settings size={16} />
                  <span className="hidden sm:inline">관리자</span>
                </Link>

                <Link
                  href="/admin/posts/new"
                  className="flex h-10 items-center gap-2 rounded-full bg-[var(--color-accent)] px-3 text-sm font-bold text-white shadow-[var(--shadow-control)] transition-all hover:brightness-105 sm:px-4"
                >
                  <PenLine size={16} />
                  <span>새 글</span>
                </Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="flex h-10 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-control)] px-3 text-sm font-medium text-[var(--color-text-muted)] shadow-[var(--shadow-control)] backdrop-blur-2xl transition-colors hover:bg-[var(--color-surface-strong)] hover:text-red-500 sm:px-4"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="flex h-10 items-center gap-2 rounded-full px-2 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)] sm:px-4"
            >
              <User size={18} />
              <span>로그인</span>
            </Link>

            <Link
              href="/signup"
              className="flex h-10 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-control)] px-3 text-sm font-bold text-[var(--color-accent)] shadow-[var(--shadow-control)] backdrop-blur-2xl transition-all hover:bg-[var(--color-surface-strong)] sm:px-4"
            >
              <UserPlus size={16} />
              <span>회원가입</span>
            </Link>
          </>
        )
      )}
    </div>
  );
}
