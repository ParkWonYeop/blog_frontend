// src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  isLoggedIn: boolean;
  role: string | null;
  _hasHydrated: boolean; // 👈 추가: 데이터 로딩 완료 여부
  
  login: (token: string) => void;
  logout: () => void;
  setHydrated: () => void; // 👈 추가: 로딩 완료 상태 변경 함수
}

// ... (getRoleFromToken 함수는 기존과 동일하게 유지하거나, 아래에 포함시켰습니다) ...
const getRoleFromToken = (token: string): string => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const decoded = JSON.parse(jsonPayload);
    return decoded.role || decoded.roles || decoded.auth || 'USER';
  } catch (e) {
    return 'USER';
  }
};

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      accessToken: null,
      isLoggedIn: false,
      role: null,
      _hasHydrated: false, // 초기값은 로딩 안됨

      login: (token: string) => {
        const role = getRoleFromToken(token);
        const finalRole = Array.isArray(role) ? role[0] : role;
        set({ accessToken: token, isLoggedIn: true, role: finalRole });
      },

      logout: () => set({ accessToken: null, isLoggedIn: false, role: null }),

      setHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage), // 명시적 스토리지 설정
      
      // 👇 핵심: 데이터를 다 불러오면(rehydrate) 실행되는 함수
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);