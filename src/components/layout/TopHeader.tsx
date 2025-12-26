// src/components/layout/TopHeader.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { LogOut, PenLine, User, UserPlus } from 'lucide-react';

export default function TopHeader() {
  const router = useRouter();
  const { isLoggedIn, role, logout } = useAuthStore(); // 👈 role 가져오기
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      alert('로그아웃 되었습니다.');
      router.push('/');
    }
  };

  if (!mounted) return null;

  return (
    <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
      {isLoggedIn ? (
        <>
          {/* 👇 관리자(ADMIN)일 때만 글쓰기 버튼 노출 */}
          {role && role.includes('ADMIN') && (
            <Link
              href="/write"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-full shadow-md hover:bg-blue-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <PenLine size={16} />
              <span>글쓰기</span>
            </Link>
          )}
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 text-sm font-medium rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 text-gray-500 text-sm font-medium hover:text-blue-600 transition-colors"
          >
            <User size={18} />
            <span>로그인</span>
          </Link>

          <Link
            href="/signup"
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded-full border border-blue-100 shadow-sm hover:bg-blue-50 hover:shadow-md transition-all"
          >
            <UserPlus size={16} />
            <span>회원가입</span>
          </Link>
        </>
      )}
    </div>
  );
}