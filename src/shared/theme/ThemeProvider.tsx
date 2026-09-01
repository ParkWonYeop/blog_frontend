'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  isThemeMode,
  THEME_STORAGE_KEY,
} from './theme';
import type { ResolvedTheme, ThemeMode } from './theme';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_MODE_EVENT = 'wyp-theme-mode-change';

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveTheme = (mode: ThemeMode): ResolvedTheme => {
  if (mode === 'system') return getSystemTheme();

  return mode;
};

const applyTheme = (mode: ThemeMode, resolvedTheme = resolveTheme(mode)) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.dataset.theme = resolvedTheme;
  root.dataset.themeMode = mode;
  root.style.colorScheme = resolvedTheme;
};

const getStoredMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';

  const savedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeMode(savedMode)) return savedMode;

  const documentMode = document.documentElement.dataset.themeMode;
  if (isThemeMode(documentMode)) return documentMode;

  return 'system';
};

const subscribeThemeMode = (callback: () => void) => {
  if (typeof window === 'undefined') return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) callback();
  };

  window.addEventListener(THEME_MODE_EVENT, callback);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(THEME_MODE_EVENT, callback);
    window.removeEventListener('storage', handleStorage);
  };
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore<ThemeMode>(subscribeThemeMode, getStoredMode, () => 'system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
  const resolvedTheme = mode === 'system' ? systemTheme : mode;

  useEffect(() => {
    applyTheme(mode, resolvedTheme);
  }, [mode, resolvedTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      setSystemTheme(getSystemTheme());
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    applyTheme(nextMode);
    window.dispatchEvent(new Event(THEME_MODE_EVENT));
  }, []);

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme,
      setMode,
    }),
    [mode, resolvedTheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
};
