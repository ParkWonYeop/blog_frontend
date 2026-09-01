'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { refreshAccessToken } from '@/features/auth/authSession';
import { isTokenExpired } from '@/features/auth/authToken';
import { useAuthStore } from '@/features/auth/store';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';

function AuthInitializer() {
  const { accessToken, logout } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      if (!accessToken) return;

      if (isTokenExpired(accessToken, 60)) {
        try {
          await refreshAccessToken();
        } catch {
          logout();
        }
      }
    };

    initializeAuth();
  }, [accessToken, logout]);

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
