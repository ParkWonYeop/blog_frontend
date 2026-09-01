'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, LockKeyhole, UserRound } from 'lucide-react';
import { login } from '@/features/auth/api';
import WindowSurface from '@/shared/ui/WindowSurface';
import { getErrorMessage } from '@/shared/lib/errors';
import { getSafeRedirectPath } from '@/shared/lib/paths';
import { useAuthStore } from '@/features/auth/store';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setLoginState } = useAuthStore();
  const redirectPath = getSafeRedirectPath(searchParams.get('redirect'));

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(formData);
      if (response.code === 'SUCCESS' && response.data) {
        setLoginState(response.data.accessToken);
        router.push(redirectPath);
      } else {
        setError(response.message || '로그인에 실패했습니다.');
      }
    } catch (loginError) {
      setError(getErrorMessage(loginError, '로그인 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center px-1 py-8">
      <WindowSurface
        title="Login Window"
        subtitle="WYPark OS"
        className="w-full max-w-md"
        bodyClassName="p-8"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-[var(--shadow-card)]">
            <UserRound size={34} strokeWidth={1.9} />
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text)]">로그인</h1>
          <p className="mt-2 text-[var(--color-text-muted)]">블로그 데스크톱으로 다시 들어갑니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">이메일</label>
            <input
              type="email"
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-4 py-2 text-[var(--color-text)] outline-none transition-all placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-accent)]"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">비밀번호</label>
            <input
              type="password"
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-4 py-2 text-[var(--color-text)] outline-none transition-all placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-accent)]"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] py-3 font-bold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LockKeyhole size={18} />}
            로그인
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="font-medium text-[var(--color-accent)] hover:underline">
            회원가입
          </Link>
        </div>
      </WindowSurface>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-[var(--color-accent)]" size={36} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
