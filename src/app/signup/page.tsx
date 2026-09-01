'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MailCheck, UserPlus } from 'lucide-react';
import { signup, verifyEmail } from '@/features/auth/api';
import WindowSurface from '@/shared/ui/WindowSurface';
import { getErrorMessage } from '@/shared/lib/errors';
import type { SignupRequest } from '@/shared/types';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'FORM' | 'VERIFY'>('FORM');
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<SignupRequest>();
  const [verifyCode, setVerifyCode] = useState('');

  const onSignupSubmit = async (data: SignupRequest) => {
    setLoading(true);
    try {
      const res = await signup(data);
      if (res.code === 'SUCCESS') {
        alert(`${data.email}로 인증 코드를 보냈습니다.`);
        setRegisteredEmail(data.email);
        setStep('VERIFY');
      } else {
        alert(`회원가입 실패: ${res.message}`);
      }
    } catch (error) {
      alert(`오류 발생: ${getErrorMessage(error, '알 수 없는 오류가 발생했습니다.')}`);
    } finally {
      setLoading(false);
    }
  };

  const onVerifySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!verifyCode) {
      alert('인증 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmail({ email: registeredEmail, code: verifyCode });
      if (res.code === 'SUCCESS') {
        alert('인증되었습니다. 로그인 페이지로 이동합니다.');
        router.push('/login');
      } else {
        alert(`인증 실패: ${res.message}`);
      }
    } catch (error) {
      alert(`오류 발생: ${getErrorMessage(error, '알 수 없는 오류가 발생했습니다.')}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center px-1 py-8">
      <WindowSurface
        title="Account Setup"
        subtitle={step === 'FORM' ? 'Create account' : registeredEmail}
        className="w-full max-w-md"
        bodyClassName="p-8"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-[var(--shadow-card)]">
            {step === 'FORM' ? <UserPlus size={34} strokeWidth={1.9} /> : <MailCheck size={34} strokeWidth={1.9} />}
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">회원가입</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {step === 'FORM' ? '블로그 OS 계정을 만듭니다.' : '이메일로 전송된 6자리 코드를 입력하세요.'}
          </p>
        </div>

        {step === 'FORM' && (
          <form onSubmit={handleSubmit(onSignupSubmit)} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">이메일</label>
              <input
                {...register('email', {
                  required: '이메일은 필수입니다.',
                  pattern: { value: /\S+@\S+\.\S+/, message: '이메일 형식이 올바르지 않습니다.' },
                })}
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
                placeholder="user@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">닉네임</label>
              <input
                {...register('nickname', { required: '닉네임을 입력해주세요.' })}
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
                placeholder="개발자"
              />
              {errors.nickname && <p className="mt-1 text-xs text-red-500">{errors.nickname.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">비밀번호</label>
              <input
                type="password"
                {...register('password', {
                  required: '비밀번호를 입력해주세요.',
                  minLength: { value: 6, message: '6자 이상 입력해주세요.' },
                })}
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--color-accent)] py-3 font-bold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '처리 중...' : '인증 메일 받기'}
            </button>
          </form>
        )}

        {step === 'VERIFY' && (
          <form onSubmit={onVerifySubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">인증 코드 (6자리)</label>
              <input
                type="text"
                value={verifyCode}
                onChange={(event) => setVerifyCode(event.target.value)}
                maxLength={6}
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-4 py-3 text-center text-2xl tracking-normal text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--color-accent)] py-3 font-bold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '처리 중...' : '인증 완료'}
            </button>

            <button
              type="button"
              onClick={() => setStep('FORM')}
              className="w-full text-sm text-[var(--color-text-muted)] hover:underline"
            >
              이메일 다시 입력하기
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-semibold text-[var(--color-accent)] hover:underline">
            로그인하기
          </Link>
        </div>
      </WindowSurface>
    </div>
  );
}
