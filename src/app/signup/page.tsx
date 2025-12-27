'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { signup, verifyEmail } from '@/api/auth';
import { SignupRequest } from '@/types';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'FORM' | 'VERIFY'>('FORM'); // 단계 관리
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');  // 인증할 이메일 저장

  // React Hook Form 설정
  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignupRequest>();
  const [verifyCode, setVerifyCode] = useState('');

  // 1단계: 회원가입 정보 제출
  const onSignupSubmit = async (data: SignupRequest) => {
    setLoading(true);
    try {
      const res = await signup(data);
      if (res.code === 'SUCCESS') {
        alert(`📧 ${data.email}로 인증 코드를 보냈습니다!`);
        setRegisteredEmail(data.email); // 이메일 기억하기
        setStep('VERIFY'); // 2단계로 이동
      } else {
        alert('회원가입 실패: ' + res.message);
      }
    } catch (error: any) {
      alert('오류 발생: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 2단계: 인증 코드 제출
  const onVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode) return alert('인증 코드를 입력해주세요.');

    setLoading(true);
    try {
      const res = await verifyEmail({ email: registeredEmail, code: verifyCode });
      if (res.code === 'SUCCESS') {
        alert('인증되었습니다! 로그인 페이지로 이동합니다.');
        router.push('/login');
      } else {
        alert('인증 실패: ' + res.message);
      }
    } catch (error: any) {
      alert('오류 발생: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🎨 배경색 수정: bg-gray-50 -> bg-white
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
          <p className="text-sm text-gray-500 mt-2">
            {step === 'FORM' ? '' : '이메일로 전송된 6자리 코드를 입력하세요.'}
          </p>
        </div>

        {/* STEP 1: 가입 정보 입력 폼 */}
        {step === 'FORM' && (
          <form onSubmit={handleSubmit(onSignupSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                {...register('email', { 
                  required: '이메일은 필수입니다.',
                  pattern: { value: /\S+@\S+\.\S+/, message: '이메일 형식이 올바르지 않습니다.' }
                })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="user@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
              <input
                {...register('nickname', { required: '닉네임을 입력해주세요.' })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="개발자"
              />
              {errors.nickname && <p className="text-red-500 text-xs mt-1">{errors.nickname.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                {...register('password', { required: '비밀번호를 입력해주세요.', minLength: { value: 6, message: '6자 이상 입력해주세요.' } })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-400"
            >
              {loading ? '처리 중...' : '인증 메일 받기'}
            </button>
          </form>
        )}

        {/* STEP 2: 인증 코드 입력 폼 */}
        {step === 'VERIFY' && (
          <form onSubmit={onVerifySubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">인증 코드 (6자리)</label>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl tracking-widest"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-400"
            >
              {loading ? '처리 중...' : '인증 완료'}
            </button>
            
            <button
              type="button"
              onClick={() => setStep('FORM')}
              className="w-full text-sm text-gray-500 hover:underline"
            >
              이메일 다시 입력하기
            </button>
          </form>
        )}

        {/* 하단 링크 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
}