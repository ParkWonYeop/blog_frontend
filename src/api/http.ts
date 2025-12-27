import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// 🛠️ 환경 변수 처리 (배포 환경 대응)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키 전송 허용 (필요 시)
});

// 1. 요청 인터셉터: 헤더에 AccessToken 주입
http.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- 토큰 갱신 관련 변수 ---
let isRefreshing = false;
let failedQueue: any[] = [];

// 실패한 요청들을 큐에 담아두었다가 토큰 갱신 후 재시도하는 함수
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 2. 응답 인터셉터: 401 발생 시 토큰 갱신 (RTR 적용)
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 401(Unauthorized) 에러이고, 아직 재시도하지 않은 요청인 경우
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      // 이미 갱신 중이라면 큐에 넣고 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return http(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { accessToken, refreshToken, login, logout } = useAuthStore.getState();

        // AccessToken이나 RefreshToken이 없으면 갱신 불가능 -> 로그아웃
        if (!accessToken || !refreshToken) {
          throw new Error('Tokens are missing for reissue');
        }

        // 🛠️ 토큰 갱신 요청 (Backend: POST /api/auth/reissue)
        // 백엔드 ReissueRequest 구조: { accessToken, refreshToken }
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/reissue`,
          { 
            accessToken, 
            refreshToken 
          },
          { 
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true 
          }
        );

        // RTR(Refresh Token Rotation) 적용:
        // 백엔드에서 AccessToken 뿐만 아니라 새로운 RefreshToken도 줍니다.
        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        // Zustand 스토어에 새 토큰 쌍 업데이트
        login(newAccessToken, newRefreshToken);

        // 큐에 대기 중이던 요청들 처리
        processQueue(null, newAccessToken);

        // 실패했던 원래 요청 재시도
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        return http(originalRequest);

      } catch (refreshError) {
        // 갱신 실패 (RefreshToken 만료/위변조 등) -> 로그아웃 처리
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        
        // 브라우저 환경인 경우 로그인 페이지로 리다이렉트
        if (typeof window !== 'undefined') {
           // alert('세션이 만료되었습니다. 다시 로그인해주세요.');
           window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);