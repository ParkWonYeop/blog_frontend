'use client';

import { Suspense, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { login } from '@/features/auth/api';
import { getErrorMessage } from '@/shared/lib/errors';
import { getSafeRedirectPath } from '@/shared/lib/paths';
import { useAuthStore } from '@/features/auth/store';

const inputClass = 'h-14 w-full rounded-2xl border px-4 text-body1 text-[var(--color-text)] outline-none';

function LoginForm() {
  const emailId = useId();
  const passwordId = useId();
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
        setError(response.message || '로그인하지 못했어요');
      }
    } catch (loginError) {
      setError(getErrorMessage(loginError, '로그인하지 못했어요'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100svh-14rem)] w-full max-w-[400px] flex-col justify-center py-6">
      <h1 className="text-title2 font-bold text-[var(--color-text)]">로그인</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor={emailId} className="mb-2 block text-body2 font-medium text-[var(--color-text-muted)]">이메일</label>
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
            className={inputClass}
            placeholder="example@email.com"
            required
          />
        </div>

        <div>
          <label htmlFor={passwordId} className="mb-2 block text-body2 font-medium text-[var(--color-text-muted)]">비밀번호</label>
          <input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
            className={inputClass}
            required
          />
        </div>

        {error && <p role="alert" className="text-body2 text-[var(--color-danger)]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-[var(--color-accent)] text-body1 font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" size={20} aria-label="로그인하는 중" /> : '로그인'}
        </button>
      </form>

      <Link href="/signup" className="mx-auto mt-6 inline-flex h-10 items-center rounded-lg px-3 text-body2 font-semibold text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]">
        회원가입
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-[var(--color-text-subtle)]" size={28} aria-label="불러오는 중" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
