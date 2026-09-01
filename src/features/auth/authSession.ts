import { reissueAuth } from '@/features/auth/authRefresh';
import { useAuthStore } from '@/features/auth/store';

const AUTH_REFRESH_LOCK = 'auth-refresh-lock';

type NavigatorWithLocks = Navigator & {
  locks?: {
    request: <T>(name: string, callback: () => Promise<T> | T) => Promise<T>;
  };
};

let activeRefresh: Promise<string> | null = null;

const refreshSession = async () => {
  const { login, logout } = useAuthStore.getState();

  try {
    const response = await reissueAuth();
    const nextAccessToken = response.data.accessToken;
    login(nextAccessToken);
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
