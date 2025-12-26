import axios from 'axios';

export const http = axios.create({
  baseURL: 'http://localhost:8080', // 백엔드 주소 확인
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키 사용 시 필요
});

// 🟢 요청 인터셉터 추가 (범인 검거 현장)
http.interceptors.request.use(
  (config) => {
    // 1. 로컬 스토리지에서 zustand가 저장한 데이터 꺼내기
    const storage = localStorage.getItem('auth-storage');
    
    if (storage) {
      // Zustand는 { state: { ... }, version: 0 } 형태로 저장함
      const parsedStorage = JSON.parse(storage);
      const token = parsedStorage.state?.accessToken;

      // 2. 토큰이 있다면 헤더에 심어주기
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리용, 선택 사항)
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 토큰 만료 시 로그아웃 처리 등을 여기서 할 수 있음
      console.error('인증 실패: 토큰이 만료되었거나 유효하지 않습니다.');
    }
    return Promise.reject(error);
  }
);