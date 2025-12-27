import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// 🛠️ 환경 변수 처리 (배포 환경 대응)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키 전송 허용
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

// 실제 토큰 갱신을 수행하는 함수 (Lock 안에서 실행됨)
async function handleTokenRefresh() {
  try {
    const { accessToken: currentAccessToken, refreshToken: currentRefreshToken, login, logout } = useAuthStore.getState();
    
    // [1] 로컬 스토리지 확인 (다른 탭에서 이미 갱신했는지 체크)
    let actualRefreshToken = currentRefreshToken;
    let actualAccessToken = currentAccessToken;

    if (typeof window !== 'undefined') {
      const storageData = localStorage.getItem('auth-storage');
      if (storageData) {
        try {
          const parsed = JSON.parse(storageData);
          const storedRefreshToken = parsed.state?.refreshToken;
          const storedAccessToken = parsed.state?.accessToken;

          // 저장된 토큰이 현재 메모리의 토큰과 다르다면? => 이미 다른 탭/요청이 갱신을 완료함!
          if (storedRefreshToken && currentRefreshToken && storedRefreshToken !== currentRefreshToken) {
            // 현재 탭의 스토어 상태를 스토리지와 동기화
            login(storedAccessToken, storedRefreshToken);
            // 대기 중인 요청들 해소
            processQueue(null, storedAccessToken);
            // 갱신 API 호출 없이 새 토큰 반환
            return storedAccessToken;
          }
          
          // 갱신 시도할 토큰 정보를 최신 스토리지 값으로 설정
          if (storedRefreshToken) actualRefreshToken = storedRefreshToken;
          if (storedAccessToken) actualAccessToken = storedAccessToken;
        } catch (e) {
          // console.error('Storage parse error', e);
        }
      }
    }

    if (!actualAccessToken || !actualRefreshToken) {
      throw new Error('No tokens found for reissue');
    }

    // [2] 서버에 토큰 갱신 요청 (Backend: POST /api/auth/reissue)
    const { data } = await axios.post(
      `${BASE_URL}/api/auth/reissue`,
      { accessToken: actualAccessToken, refreshToken: actualRefreshToken },
      { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
    );

    const newAccessToken = data.data.accessToken;
    const newRefreshToken = data.data.refreshToken;

    // [3] 상태 업데이트
    login(newAccessToken, newRefreshToken);
    processQueue(null, newAccessToken);
    
    return newAccessToken;

  } catch (error) {
    // 갱신 실패 (RefreshToken 만료/위변조/재사용 감지 등) -> 로그아웃
    processQueue(error, null);
    useAuthStore.getState().logout();
    
    if (typeof window !== 'undefined') {
       // 데이터 보호를 위해 confirm을 띄우거나, 조용히 로그인 페이지로 이동
       // window.location.href = '/login';
    }
    throw error;
  }
}

// 2. 응답 인터셉터: 401 발생 시 토큰 갱신 (Web Lock 적용)
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) return Promise.reject(error);
    
    const status = error.response.status;

    // 401(Unauthorized) 에러이고, 아직 재시도하지 않은 요청인 경우
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      
      // [Case 1] 이미 같은 탭 내에서 갱신이 진행 중이라면 큐에 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
             if (!originalRequest.headers) originalRequest.headers = {};
             originalRequest.headers['Authorization'] = `Bearer ${token}`;
             return http(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // [Case 2] 브라우저 탭 간 동기화를 위한 Web Locks API 사용
      // 'navigator.locks'를 통해 여러 탭이 동시에 갱신을 시도해도 순차적으로 처리되도록 보장
      try {
        let newToken;
        
        if (typeof navigator !== 'undefined' && 'locks' in navigator) {
          // Lock을 획득한 놈만 handleTokenRefresh 실행
          newToken = await (navigator as any).locks.request('auth-refresh-lock', async () => {
             return await handleTokenRefresh();
          });
        } else {
          // Web Locks 미지원 브라우저 폴백 (거의 없겠지만 안전장치)
          newToken = await handleTokenRefresh();
        }

        if (!originalRequest.headers) originalRequest.headers = {};
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return http(originalRequest);

      } catch (refreshError) {
        // 갱신 실패 시
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);