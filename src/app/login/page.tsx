// src/app/login/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { LoginRequest } from '@/types';
import Link from 'next/link'; // 👈 추가
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { login: setLoginState } = useAuthStore();
  const [loading, setLoading] = useState(false); // 로딩 상태 추가

  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    try {
      const res = await login(data);
      
      if (res.code === 'SUCCESS' && res.data) {
        setLoginState(res.data.accessToken);
        // alert('환영합니다! 😎');
        router.push('/');
      } else {
        alert('로그인 실패: ' + res.message);
      }
    } catch (error: any) {
      console.error(error);
      alert('로그인 중 오류가 발생했습니다: ' + (error.response?.data?.message || '서버 오류'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">로그인 🔐</h1>
          <p className="text-sm text-gray-500 mt-2">블로그 관리자 및 회원 로그인</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              {...register('email', { required: '이메일을 입력해주세요.' })}
              type="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="user@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              {...register('password', { required: '비밀번호를 입력해주세요.' })}
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-400"
          >
            {loading ? '로그인 중...' : '로그인하기'}
          </button>
        </form>
        
        {/* 회원가입 링크 추가 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
            회원가입하기
          </Link>
        </div>
      </div>
    </div>
  );
}