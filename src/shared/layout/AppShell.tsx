'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import AppBar from '@/shared/layout/AppBar';
import Sidebar from '@/shared/layout/Sidebar';
import TabBar from '@/shared/layout/TabBar';
import { SIDEBAR_COLLAPSED_STORAGE_KEY } from '@/shared/layout/navigation';
import { PageFocusContext } from '@/shared/layout/PageFocusContext';

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  const isFocused = focusedPath === pathname;

  useEffect(() => {
    const savedValue = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (!savedValue) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      setIsSidebarCollapsed(savedValue === 'true');
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsMobileSidebarOpen(false);
      setFocusedPath(null);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [pathname]);

  const handleSidebarToggle = () => {
    const nextValue = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextValue);
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(nextValue));
  };

  const handleFocusChange = (focused: boolean) => {
    setFocusedPath(focused ? pathname : null);
    window.scrollTo({ top: 0 });
  };

  const isChessRoute = pathname.startsWith('/chess') || pathname.startsWith('/play/chess');

  return (
    <PageFocusContext value={{ isFocused, setFocused: handleFocusChange }}>
      {!isFocused && (
        <>
          <AppBar isSidebarCollapsed={isSidebarCollapsed} onToggleSidebar={handleSidebarToggle} />
          <Sidebar
            isDesktopCollapsed={isSidebarCollapsed}
            isMobileOpen={isMobileSidebarOpen}
            onMobileOpenChange={setIsMobileSidebarOpen}
          />
          <TabBar onOpenExplore={() => setIsMobileSidebarOpen(true)} />
        </>
      )}

      <main
        className={clsx(
          'relative min-h-screen min-w-0 overflow-x-clip transition-[padding] duration-200 ease-standard',
          !isFocused && 'pt-14',
          !isFocused && !isSidebarCollapsed && 'md:pl-[264px]',
        )}
      >
        <div
          className={clsx(
            'mx-auto w-full min-w-0',
            isFocused
              ? 'px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6'
              : [
                  'pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-6 md:px-8 md:pb-20 md:pt-10',
                  isChessRoute ? 'px-2 sm:px-4' : 'px-4',
                ],
          )}
        >
          {children}
        </div>
      </main>
    </PageFocusContext>
  );
}
