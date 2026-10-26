'use client';

import { useRouter } from 'next/navigation';
import { logoutSession } from '@/features/auth/authSession';
import { useAuthStore } from '@/features/auth/store';

/** 서버 세션 폐기가 실패해도 로컬 로그아웃은 진행한다. */
export default function useLogout(onDone?: () => void) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return async () => {
    if (!confirm('로그아웃할까요?')) return;

    try {
      await logoutSession();
    } finally {
      logout();
      onDone?.();
      router.push('/');
    }
  };
}
