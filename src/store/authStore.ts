import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

interface UserInfo {
  memberId: number;
  nickname: string;
  email: string;
}

interface JwtPayload {
  memberId?: number;
  auth?: string;
  nickname?: string;
  sub?: string;
}

interface AuthState {
  accessToken: string | null;
  isLoggedIn: boolean;
  role: string | null;
  user: UserInfo | null;
  _hasHydrated: boolean;
  login: (accessToken: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

const parseToken = (token: string): { role: string; user: UserInfo | null } => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);

    return {
      role: decoded.auth || 'USER',
      user: {
        memberId: decoded.memberId ?? 0,
        nickname: decoded.nickname || 'User',
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
      isLoggedIn: false,
      role: null,
      user: null,
      _hasHydrated: false,
      
      login: (accessToken: string) => {
        const { role, user } = parseToken(accessToken);
        set({ accessToken, isLoggedIn: true, role, user });
      },
      
      logout: () => set({ accessToken: null, isLoggedIn: false, role: null, user: null }),
      
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
