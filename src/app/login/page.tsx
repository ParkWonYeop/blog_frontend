'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

const getSafeRedirectPath = (value: string | null) => {
  if (!value) return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  if (value.startsWith('/login')) return '/';
  if (value.includes('://')) return '/';

  return value;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  if (error instanceof Error) return error.message;

  return '로그인 중 오류가 발생했습니다.';
};

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
        setLoginState(response.data.accessToken, response.data.refreshToken);
        router.push(redirectPath);
      } else {
        setError(response.message || '로그인에 실패했습니다.');
      }
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-page)] p-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">로그인</h1>
          <p className="mt-2 text-[var(--color-text-muted)]">블로그에 오신 것을 환영합니다.</p>
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
            {loading && <Loader2 className="animate-spin" size={20} />}
            로그인
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="font-medium text-[var(--color-accent)] hover:underline">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="animate-spin text-[var(--color-accent)]" size={36} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
