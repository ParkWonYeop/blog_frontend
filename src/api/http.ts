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

// 2. 응답 인터셉터: 401 발생 시 토큰 갱신 (RTR 적용 + 멀티탭 동기화 안전장치)
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 응답 자체가 없는 네트워크 에러 등은 바로 reject
    if (!error.response) return Promise.reject(error);
    
    const status = error.response.status;

    // 401(Unauthorized) 에러이고, 아직 재시도하지 않은 요청인 경우
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      
      // [안전장치 1] 이미 갱신된 토큰이 있는지 스토어 메모리 확인 (동시성 요청 제어)
      const { accessToken: currentAccessToken, refreshToken: currentRefreshToken, login, logout } = useAuthStore.getState();
      const requestAccessToken = originalRequest.headers['Authorization']?.split(' ')[1];

      // 요청 보낼 때 쓴 토큰과 현재 스토어 토큰이 다르다면? => 이미 누군가 갱신함!
      if (currentAccessToken && requestAccessToken && currentAccessToken !== requestAccessToken) {
        originalRequest.headers['Authorization'] = `Bearer ${currentAccessToken}`;
        return http(originalRequest);
      }

      // 이미 갱신 프로세스가 진행 중이라면 큐에 넣고 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            const newConfig = {
              ...originalRequest,
              headers: {
                ...originalRequest.headers,
                'Authorization': `Bearer ${token}`
              }
            };
            return http(newConfig);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // [안전장치 2] 로컬 스토리지 직접 확인 (멀티 탭 이슈 해결의 핵심!)
        // 다른 탭에서 리프레시를 했다면 localStorage에는 최신 값이 있지만, 
        // 현재 탭의 메모리(Zustand)에는 옛날 값이 있을 수 있음.
        // 옛날 RefreshToken을 보내면 백엔드가 "토큰 탈취"로 간주하고 로그아웃 시키므로 이를 방지해야 함.
        let actualRefreshToken = currentRefreshToken;
        let actualAccessToken = currentAccessToken;

        if (typeof window !== 'undefined') {
          const storageData = localStorage.getItem('auth-storage'); // Zustand persist 키
          if (storageData) {
            const parsed = JSON.parse(storageData);
            const storedRefreshToken = parsed.state?.refreshToken;
            const storedAccessToken = parsed.state?.accessToken;

            // 로컬 스토리지의 토큰이 현재 메모리보다 최신(다름)이라면?
            if (storedRefreshToken && storedRefreshToken !== currentRefreshToken) {
              // 갱신 요청 보내지 말고 스토어를 최신화하고 재시도
              login(storedAccessToken, storedRefreshToken);
              processQueue(null, storedAccessToken);
              
              const newConfig = {
                ...originalRequest,
                headers: { ...originalRequest.headers, 'Authorization': `Bearer ${storedAccessToken}` }
              };
              return http(newConfig);
            }
            // 최신 토큰 정보를 변수에 업데이트 (갱신 요청에 사용)
            if (storedRefreshToken) actualRefreshToken = storedRefreshToken;
            if (storedAccessToken) actualAccessToken = storedAccessToken;
          }
        }

        // 토큰이 아예 없으면 갱신 시도 불가 -> 로그아웃
        if (!actualAccessToken || !actualRefreshToken) {
          throw new Error('Tokens are missing for reissue');
        }

        // 🛠️ 토큰 갱신 요청 (Backend: POST /api/auth/reissue)
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/reissue`,
          { 
            accessToken: actualAccessToken, 
            refreshToken: actualRefreshToken 
          },
          { 
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true 
          }
        );

        // RTR(Refresh Token Rotation): 새 토큰 받기
        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        // 스토어 업데이트
        login(newAccessToken, newRefreshToken);

        // 큐에 대기 중이던 요청들 처리
        processQueue(null, newAccessToken);

        // 실패했던 원래 요청 재시도
        const newConfig = {
            ...originalRequest,
            headers: {
              ...originalRequest.headers,
              'Authorization': `Bearer ${newAccessToken}`
            }
        };
        return http(newConfig);

      } catch (refreshError) {
        // 갱신 실패 (RefreshToken 만료/위변조 등) -> 로그아웃 처리
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        
        // 🚨 작성 중인 데이터 보호를 위해 강제 리다이렉트는 최소화
        // 401/403 등 명확한 인증 실패일 때만 로그인 페이지로 이동
        // (단, 페이지 새로고침은 하지 않음 -> SPA 라우팅이 더 안전하지만 여기선 href 사용 시 주의)
        if (typeof window !== 'undefined') {
           // 글쓰기 페이지 등에서 갑자기 튕기는 것보다, 저장이 안 된다는 걸 알리는게 나음
           console.error('Session expired. Please login again.');
           // window.location.href = '/login'; // 👈 이 코드가 강제 새로고침을 유발하여 데이터를 날립니다.
           // 대신 메인화면으로 튕기거나 모달을 띄우는게 좋지만, 일단 주석 처리하거나 신중히 사용하세요.
           // 정말 만료되어 갱신 불가할 때만 이동:
           alert('세션이 만료되었습니다. 새 창에서 로그인해주세요.');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);