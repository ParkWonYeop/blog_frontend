import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// 🛠️ 보안 개선: jwt-decode 라이브러리 사용 (npm install jwt-decode 필요)
import { jwtDecode } from 'jwt-decode';

// 토큰에서 추출할 사용자 정보 타입
interface UserInfo {
  memberId: number;
  nickname: string;
  email: string;
}

// JWT Payload 타입 정의
interface JwtPayload {
  userId?: number;
  memberId?: number;
  id?: number;
  role?: string;
  roles?: string;
  auth?: string;
  nickname?: string;
  name?: string;
  sub?: string;
  [key: string]: any;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  role: string | null;
  user: UserInfo | null;
  _hasHydrated: boolean;
  login: (accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

// 🛠️ 개선됨: 라이브러리를 사용한 안전한 파싱
const parseToken = (token: string): { role: string; user: UserInfo | null } => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);

    return {
      // 권한 정보 매핑 (백엔드 키값에 따라 유동적 대응)
      role: decoded.role || decoded.roles || decoded.auth || 'USER',
      user: {
        memberId: Number(decoded.userId || decoded.memberId || decoded.id || 0),
        nickname: decoded.nickname || decoded.name || 'User',
        email: decoded.sub || '',
      }
    };
  } catch (e) {
    // console.error('Token parsing error:', e);
    return { role: 'USER', user: null };
  }
};

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isLoggedIn: false,
      role: null,
      user: null,
      _hasHydrated: false,
      
      login: (accessToken: string, refreshToken?: string) => {
        const { role, user } = parseToken(accessToken);
        set({ 
          accessToken, 
          refreshToken: refreshToken || null, 
          isLoggedIn: true, 
          role,
          user 
        });
      },
      
      logout: () => set({ 
        accessToken: null, 
        refreshToken: null, 
        isLoggedIn: false, 
        role: null,
        user: null 
      }),
      
      setHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
      // 💡 추가 팁: 보안상 민감한 refreshToken은 localStorage 저장을 제외하고 싶다면
      // partial settings를 사용할 수 있습니다. (로그인 유지를 위해선 백엔드 쿠키가 필요)
      // partialize: (state) => ({ accessToken: state.accessToken, isLoggedIn: state.isLoggedIn, user: state.user, role: state.role }),
    }
  )
);