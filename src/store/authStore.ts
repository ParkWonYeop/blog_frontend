import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

interface UserInfo {
  memberId: number;
  nickname: string;
  email: string;
}

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
  [key: string]: unknown;
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

const parseToken = (token: string): { role: string; user: UserInfo | null } => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);

    return {
      role: decoded.role || decoded.roles || decoded.auth || 'USER',
      user: {
        memberId: Number(decoded.userId || decoded.memberId || decoded.id || 0),
        nickname: decoded.nickname || decoded.name || 'User',
        email: decoded.sub || '',
      }
    };
  } catch {
    return { role: 'USER', user: null };
  }
};

export const useAuthStore = create<AuthState>()(
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
    }
  )
);
