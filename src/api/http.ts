import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// 🛠️ 환경 변수 처리 (배포 환경 대응)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키(RefreshToken) 전송을 위해 필수
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

// 2. 응답 인터셉터: 401 또는 403 발생 시 토큰 갱신
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status; // 응답 상태 코드 확인

    // 401(Unauthorized) 또는 403(Forbidden) 에러이고, 아직 재시도하지 않은 요청인 경우
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      // 이미 갱신 중이라면 큐에 넣고 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // 대기하던 요청들도 새 토큰으로 헤더 교체 후 재시도
            if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return http(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true; // 재시도 플래그 설정 (무한 루프 방지)
      isRefreshing = true;

      try {
        const { refreshToken, login, logout } = useAuthStore.getState();

        // RefreshToken이 없으면 갱신 시도 없이 바로 로그아웃
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // 🛠️ 토큰 갱신 요청
        // 중요: refresh 요청도 쿠키/CORS 처리를 위해 withCredentials: true 추가
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/refresh`, 
          { refreshToken },
          { withCredentials: true }
        );

        // 새 토큰 저장
        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken || refreshToken;
        
        login(newAccessToken, newRefreshToken); // 스토어 업데이트

        // 큐에 대기 중이던 요청들 처리 (새 토큰 전달)
        processQueue(null, newAccessToken);

        // 실패했던 원래 요청 재시도 (헤더 안전하게 교체)
        if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        return http(originalRequest);

      } catch (refreshError) {
        // 갱신 실패 시 로그아웃 및 큐 정리
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        
        // 브라우저 환경에서만 로그인 페이지로 이동
        if (typeof window !== 'undefined') {
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