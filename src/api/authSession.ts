import { reissueAuth } from '@/api/authRefresh';
import { useAuthStore } from '@/store/authStore';

const AUTH_STORAGE_KEY = 'auth-storage';
const AUTH_REFRESH_LOCK = 'auth-refresh-lock';

type StoredAuthState = {
  state?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

type NavigatorWithLocks = Navigator & {
  locks?: {
    request: <T>(name: string, callback: () => Promise<T> | T) => Promise<T>;
  };
};

let activeRefresh: Promise<string> | null = null;

const readStoredTokens = () => {
  if (typeof window === 'undefined') return null;

  const serializedState = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!serializedState) return null;

  try {
    return (JSON.parse(serializedState) as StoredAuthState).state ?? null;
  } catch {
    return null;
  }
};

const refreshSession = async () => {
  const {
    accessToken: currentAccessToken,
    refreshToken: currentRefreshToken,
    login,
    logout,
  } = useAuthStore.getState();
  const storedTokens = readStoredTokens();

  if (
    storedTokens?.accessToken
    && storedTokens.refreshToken
    && currentRefreshToken
    && storedTokens.refreshToken !== currentRefreshToken
  ) {
    login(storedTokens.accessToken, storedTokens.refreshToken);
    return storedTokens.accessToken;
  }

  const accessToken = storedTokens?.accessToken ?? currentAccessToken;
  const refreshToken = storedTokens?.refreshToken ?? currentRefreshToken;

  if (!accessToken || !refreshToken) {
    logout();
    throw new Error('인증 토큰을 찾을 수 없습니다.');
  }

  try {
    const response = await reissueAuth(accessToken, refreshToken);
    const nextAccessToken = response.data.accessToken;
    const nextRefreshToken = response.data.refreshToken;

    login(nextAccessToken, nextRefreshToken);
    return nextAccessToken;
  } catch (error) {
    logout();
    throw error;
  }
};

const refreshWithCrossTabLock = async () => {
  const locks = typeof navigator === 'undefined'
    ? undefined
    : (navigator as NavigatorWithLocks).locks;

  return locks
    ? locks.request(AUTH_REFRESH_LOCK, refreshSession)
    : refreshSession();
};

/** Shares one refresh request per tab while Web Locks serialize refreshes across tabs. */
export const refreshAccessToken = () => {
  if (activeRefresh) return activeRefresh;

  activeRefresh = refreshWithCrossTabLock().finally(() => {
    activeRefresh = null;
  });

  return activeRefresh;
};
