'use client';

import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { signup, verifyEmail } from '@/features/auth/api';
import { getErrorMessage } from '@/shared/lib/errors';
import type { SignupRequest } from '@/shared/types';

const inputClass = 'h-14 w-full rounded-2xl border px-4 text-body1 text-[var(--color-text)] outline-none';

export default function SignupPage() {
  const fieldId = useId();
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
        toast.success(`${data.email}로 코드를 보냈어요`);
        setRegisteredEmail(data.email);
        setStep('VERIFY');
      } else {
        toast.error(res.message || '가입하지 못했어요');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, '잠시 후 다시 시도해 주세요'));
    } finally {
      setLoading(false);
    }
  };

  const onVerifySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!verifyCode) {
      toast.error('인증 코드를 입력해 주세요');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmail({ email: registeredEmail, code: verifyCode });
      if (res.code === 'SUCCESS') {
        toast.success('인증을 마쳤어요');
        router.push('/login');
      } else {
        toast.error(res.message || '코드를 확인해 주세요');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, '잠시 후 다시 시도해 주세요'));
    } finally {
      setLoading(false);
    }
  };

  const submitClass = 'flex h-14 w-full items-center justify-center rounded-2xl bg-[var(--color-accent)] text-body1 font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60';
  const labelClass = 'mb-2 block text-body2 font-medium text-[var(--color-text-muted)]';
  const errorClass = 'mt-1.5 text-caption1 text-[var(--color-danger)]';

  return (
    <div className="mx-auto flex min-h-[calc(100svh-14rem)] w-full max-w-[400px] flex-col justify-center py-6">
      {step === 'FORM' ? (
        <>
          <h1 className="text-title2 font-bold text-[var(--color-text)]">회원가입</h1>

          <form onSubmit={handleSubmit(onSignupSubmit)} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor={`${fieldId}-email`} className={labelClass}>이메일</label>
              <input
                id={`${fieldId}-email`}
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register('email', {
                  required: '이메일을 입력해 주세요',
                  pattern: { value: /\S+@\S+\.\S+/, message: '이메일 형식을 확인해 주세요' },
                })}
                className={inputClass}
                placeholder="user@example.com"
              />
              {errors.email && <p className={errorClass}>{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor={`${fieldId}-nickname`} className={labelClass}>닉네임</label>
              <input
                id={`${fieldId}-nickname`}
                autoComplete="nickname"
                aria-invalid={Boolean(errors.nickname)}
                {...register('nickname', { required: '닉네임을 입력해 주세요' })}
                className={inputClass}
              />
              {errors.nickname && <p className={errorClass}>{errors.nickname.message}</p>}
            </div>

            <div>
              <label htmlFor={`${fieldId}-password`} className={labelClass}>비밀번호</label>
              <input
                id={`${fieldId}-password`}
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                {...register('password', {
                  required: '비밀번호를 입력해 주세요',
                  minLength: { value: 6, message: '6자 이상 입력해 주세요' },
                })}
                className={inputClass}
                placeholder="6자 이상"
              />
              {errors.password && <p className={errorClass}>{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className={submitClass}>
              {loading ? <Loader2 className="animate-spin" size={20} aria-label="보내는 중" /> : '인증 코드 받기'}
            </button>
          </form>

          <Link href="/login" className="mx-auto mt-6 inline-flex h-10 items-center rounded-lg px-3 text-body2 font-semibold text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]">
            로그인
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-title2 font-bold text-[var(--color-text)]">메일로 받은 코드를 입력해 주세요</h1>
          <p className="mt-2 break-all text-body2 text-[var(--color-text-subtle)]">{registeredEmail}</p>

          <form onSubmit={onVerifySubmit} className="mt-8 space-y-5">
            <label htmlFor={`${fieldId}-code`} className="sr-only">인증 코드</label>
            <input
              id={`${fieldId}-code`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={verifyCode}
              onChange={(event) => setVerifyCode(event.target.value)}
              maxLength={6}
              className={`${inputClass} text-center text-title2 font-bold tabular-nums tracking-[0.3em]`}
              placeholder="000000"
            />

            <button type="submit" disabled={loading} className={submitClass}>
              {loading ? <Loader2 className="animate-spin" size={20} aria-label="확인하는 중" /> : '확인'}
            </button>

            <button
              type="button"
              onClick={() => setStep('FORM')}
              className="mx-auto flex h-10 items-center rounded-lg px-3 text-body2 font-semibold text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
            >
              이메일 바꾸기
            </button>
          </form>
        </>
      )}
    </div>
  );
}
