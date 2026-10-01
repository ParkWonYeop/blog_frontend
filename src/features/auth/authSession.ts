import { reissueAuth, revokeAuth } from '@/features/auth/authRefresh';
import { isTokenExpired } from '@/features/auth/authToken';
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

const broadcastLogout = () => {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel(AUTH_SESSION_CHANNEL);
  channel.postMessage('LOGOUT');
  channel.close();
};

export const logoutSession = async () => {
  let accessToken = useAuthStore.getState().accessToken;

  try {
    if (!accessToken || isTokenExpired(accessToken, 10)) {
      accessToken = await refreshAccessToken();
    }
    await revokeAuth(accessToken);
  } finally {
    useAuthStore.getState().logout();
    broadcastLogout();
  }
};

export const subscribeToSessionLogout = (onLogout: () => void) => {
  if (typeof BroadcastChannel === 'undefined') return () => undefined;
  const channel = new BroadcastChannel(AUTH_SESSION_CHANNEL);
  channel.addEventListener('message', (event) => {
    if (event.data === 'LOGOUT') onLogout();
  });
  return () => channel.close();
};

const AUTH_SESSION_CHANNEL = 'wyp-auth-session';
