'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import DesktopDock from '@/shared/layout/DesktopDock';
import DesktopMenuBar from '@/shared/layout/DesktopMenuBar';
import Sidebar from '@/shared/layout/Sidebar';
import { PageFocusContext } from '@/shared/layout/PageFocusContext';

export default function DesktopShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  const isFocused = focusedPath === pathname;

  useEffect(() => {
    const savedValue = window.localStorage.getItem('sidebar-collapsed');
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

  const handleSidebarCollapsedChange = (nextValue: boolean) => {
    setIsSidebarCollapsed(nextValue);
    window.localStorage.setItem('sidebar-collapsed', String(nextValue));
  };

  const handleFocusChange = (focused: boolean) => {
    setFocusedPath(focused ? pathname : null);
    window.scrollTo({ top: 0 });
  };

  const isReaderRoute = pathname.startsWith('/posts/');
  const isChessRoute = pathname.startsWith('/chess') || pathname.startsWith('/play/chess');

  return (
    <PageFocusContext value={{ isFocused, setFocused: handleFocusChange }}>
      <div className="desktop-shell min-h-screen overflow-x-clip">
        {!isFocused && (
          <>
            <Sidebar
              isDesktopCollapsed={isSidebarCollapsed}
              isMobileOpen={isMobileSidebarOpen}
              onDesktopCollapsedChange={handleSidebarCollapsedChange}
              onMobileOpenChange={setIsMobileSidebarOpen}
            />
            <DesktopMenuBar />
            <DesktopDock onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />
          </>
        )}

        <main
          className={clsx(
            'relative z-10 min-w-0 max-w-full flex-1 overflow-x-clip transition-[margin,width] duration-300 ease-out',
            isFocused ? 'w-full' : isSidebarCollapsed
              ? 'md:ml-[7rem] md:w-[calc(100%-7rem)]'
              : 'md:ml-[20rem] md:w-[calc(100%-20rem)]',
          )}
        >
          <div
            className={clsx(
              'mx-auto min-w-0 max-w-full',
              isFocused
                ? 'px-1.5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6'
                : ['md:px-6 md:pt-16 lg:px-8', isChessRoute ? 'px-1.5 pt-3 pb-44 md:pb-40' : isReaderRoute ? 'px-3 pt-14 pb-44 md:pb-36' : 'px-3 pt-14 pb-36 md:pb-32'],
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </PageFocusContext>
  );
}
