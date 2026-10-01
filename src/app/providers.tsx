'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { refreshAccessToken, subscribeToSessionLogout } from '@/features/auth/authSession';
import { useAuthStore } from '@/features/auth/store';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';

function AuthInitializer() {
  const { logout, setHydrated } = useAuthStore();

  useEffect(() => {
    let active = true;
    window.localStorage.removeItem('auth-storage');
    const unsubscribe = subscribeToSessionLogout(logout);

    const initializeAuth = async () => {
      try {
        await refreshAccessToken();
      } catch {
        logout();
      } finally {
        if (active) setHydrated();
      }
    };

    void initializeAuth();
    return () => {
      active = false;
      unsubscribe();
    };
  }, [logout, setHydrated]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false, 
            retry: 1,
            staleTime: 1000 * 60 * 5,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer />
        {children}
        <Toaster position="top-right" />
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
