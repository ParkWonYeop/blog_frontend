'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import DesktopDock from '@/components/layout/DesktopDock';
import DesktopMenuBar from '@/components/layout/DesktopMenuBar';
import Sidebar from '@/components/layout/Sidebar';

export default function DesktopShell({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedValue = window.localStorage.getItem('sidebar-collapsed');
    if (!savedValue) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      setIsSidebarCollapsed(savedValue === 'true');
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const handleSidebarCollapsedChange = (nextValue: boolean) => {
    setIsSidebarCollapsed(nextValue);
    window.localStorage.setItem('sidebar-collapsed', String(nextValue));
  };

  return (
    <div className="min-h-screen">
      <Sidebar
        isDesktopCollapsed={isSidebarCollapsed}
        onDesktopCollapsedChange={handleSidebarCollapsedChange}
      />
      <DesktopMenuBar isSidebarCollapsed={isSidebarCollapsed} />
      <DesktopDock isSidebarCollapsed={isSidebarCollapsed} />

      <main
        className={clsx(
          'relative w-full flex-1 transition-[margin,width] duration-300 ease-out',
          isSidebarCollapsed
            ? 'md:ml-20 md:w-[calc(100%-5rem)]'
            : 'md:ml-72 md:w-[calc(100%-18rem)]',
        )}
      >
        <div className="mx-auto w-full px-4 pb-28 pt-20 md:px-6 md:pb-32 md:pt-24 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
