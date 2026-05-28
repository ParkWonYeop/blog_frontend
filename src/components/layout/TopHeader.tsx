// src/components/layout/TopHeader.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LogOut, PenLine, Settings, User, UserPlus } from 'lucide-react';

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

  if (!_hasHydrated) return null;

  return (
    <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
      {isLoggedIn ? (
        <>
          {isAdmin && (
            <>
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/75 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] shadow-sm backdrop-blur-xl transition-colors hover:bg-white hover:text-[var(--color-accent)] dark:bg-white/10"
              >
                <Settings size={16} />
                <span className="hidden sm:inline">관리자</span>
              </Link>

              <Link
                href="/admin/posts/new"
                className="flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
              >
                <PenLine size={16} />
                <span>새 글</span>
              </Link>
            </>
          )}
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/75 px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] shadow-sm backdrop-blur-xl transition-colors hover:bg-white hover:text-red-500 dark:bg-white/10"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
          >
            <User size={18} />
            <span>로그인</span>
          </Link>

          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/75 px-4 py-2 text-sm font-bold text-[var(--color-accent)] shadow-sm backdrop-blur-xl transition-all hover:bg-white hover:shadow-md dark:bg-white/10"
          >
            <UserPlus size={16} />
            <span>회원가입</span>
          </Link>
        </>
      )}
    </div>
  );
}
