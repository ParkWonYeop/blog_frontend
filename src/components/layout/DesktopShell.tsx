'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import DesktopDock from '@/components/layout/DesktopDock';
import DesktopMenuBar from '@/components/layout/DesktopMenuBar';
import Sidebar from '@/components/layout/Sidebar';

export default function DesktopShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [pathname]);

  const handleSidebarCollapsedChange = (nextValue: boolean) => {
    setIsSidebarCollapsed(nextValue);
    window.localStorage.setItem('sidebar-collapsed', String(nextValue));
  };

  const isReaderRoute = pathname.startsWith('/posts/');
  const isChessRoute = pathname.startsWith('/play/chess');

  return (
    <div className="min-h-screen overflow-x-clip">
      <Sidebar
        isDesktopCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onDesktopCollapsedChange={handleSidebarCollapsedChange}
        onMobileOpenChange={setIsMobileSidebarOpen}
      />
      <DesktopMenuBar isSidebarCollapsed={isSidebarCollapsed} />
      <DesktopDock
        isSidebarCollapsed={isSidebarCollapsed}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
      />

      <main
        className={clsx(
          'relative min-w-0 max-w-full flex-1 overflow-x-clip transition-[margin,width] duration-300 ease-out',
          isSidebarCollapsed
            ? 'md:ml-20 md:w-[calc(100%-5rem)]'
            : 'md:ml-72 md:w-[calc(100%-18rem)]',
        )}
      >
        <div
          className={clsx(
            'mx-auto min-w-0 max-w-full px-3 pt-16 md:px-6 md:pt-24 lg:px-8',
            isChessRoute ? 'pb-44 md:pb-40' : isReaderRoute ? 'pb-44 md:pb-36' : 'pb-36 md:pb-32',
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
