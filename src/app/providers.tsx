'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';

// 🛠️ JWT 토큰 만료 여부 체크 함수 (라이브러리 없이 구현)
function isTokenExpired(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    
    // 현재 시간(초)이 만료 시간(exp)보다 크거나 같으면 만료됨
    // 안전 마진 60초 추가 (만료 1분 전이면 미리 갱신)
    return Date.now() / 1000 >= exp - 60;
  } catch (e) {
    return true; // 파싱 실패 시 만료된 것으로 간주
  }
}

// 🛡️ 앱 초기화 시 토큰 검증 컴포넌트
function AuthInitializer() {
  const { accessToken, refreshToken, login, logout } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      // 토큰이 없으면 검사할 필요 없음
      if (!accessToken || !refreshToken) return;

      // 토큰이 만료되었는지 확인
      if (isTokenExpired(accessToken)) {
        console.log('🔄 AccessToken expired on init, refreshing...');
        
        try {
          const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
          
          // 갱신 요청 (http 인터셉터 거치지 않고 직접 axios 사용)
          const { data } = await axios.post(
            `${BASE_URL}/api/auth/reissue`,
            { accessToken, refreshToken },
            { 
              headers: { 'Content-Type': 'application/json' },
              withCredentials: true 
            }
          );

          if (data.code === 'SUCCESS' && data.data) {
            // 갱신 성공: 스토어 업데이트
            login(data.data.accessToken, data.data.refreshToken);
            console.log('✅ Token refreshed successfully on init');
          } else {
            throw new Error('Token refresh response invalid');
          }
        } catch (error) {
          console.error('❌ Failed to refresh token on init:', error);
          // 갱신 실패 시 깔끔하게 로그아웃 처리하여 꼬임 방지
          logout();
          // 필요 시 로그인 페이지로 이동 (선택 사항)
          // window.location.href = '/login'; 
        }
      }
    };

    initializeAuth();
  }, [accessToken, refreshToken, login, logout]);

  return null; // UI를 렌더링하지 않음
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 윈도우 포커스 시 자동 리페치 방지 (불필요한 요청 줄임)
            refetchOnWindowFocus: false, 
            retry: 1,
            staleTime: 1000 * 60 * 5, // 5분간 데이터 캐싱
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer /> {/* 👈 앱 실행 시 토큰 자동 검사 */}
      {children}
      <Toaster position="top-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}