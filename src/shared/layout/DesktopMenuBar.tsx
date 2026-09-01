'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BatteryMedium, ChevronRight, Command, Monitor, Search, Wifi } from 'lucide-react';
import { getProfile } from '@/features/profile/api';
import { queryKeys } from '@/shared/lib/queryKeys';
import { decodePathSegment } from '@/shared/lib/paths';
import ThemeToggle from '@/shared/theme/ThemeToggle';

const defaultProfile = {
  githubUrl: 'https://github.com',
  email: 'user@example.com',
};

const getCategoryTitle = (pathname: string) => {
  const encodedName = pathname.split('/category/')[1]?.split('/')[0] || '';
  const decodedName = decodePathSegment(encodedName);
  return decodedName === 'uncategorized' ? '미분류' : decodedName;
};

const getAppTitle = (pathname: string) => {
  if (pathname.startsWith('/admin/posts/new')) return 'Write';
  if (pathname.startsWith('/admin/posts')) return 'Post Manager';
  if (pathname.startsWith('/admin/comments')) return 'Comment Center';
  if (pathname.startsWith('/admin/categories')) return 'Category Studio';
  if (pathname.startsWith('/admin/profile')) return 'Profile Panel';
  if (pathname.startsWith('/admin')) return 'Admin Console';
  if (pathname.startsWith('/archive')) return 'Archive';
  if (pathname.startsWith('/category')) return getCategoryTitle(pathname);
  if (pathname.startsWith('/posts')) return 'Reader';
  if (pathname.startsWith('/chess')) return 'Maia Chess';
  if (pathname.startsWith('/play/chess')) return 'Chess';
  if (pathname.startsWith('/login')) return 'Login';
  if (pathname.startsWith('/signup')) return 'Signup';
  return '홈';
};

const formatMenuTime = (date: Date | null) => {
  if (!date) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function DesktopMenuBar() {
  const pathname = usePathname();
  const [now, setNow] = useState<Date | null>(null);

  const { data: profile } = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: getProfile,
    retry: 0,
  });

  useEffect(() => {
    const updateTime = () => setNow(new Date());
    const frameId = window.requestAnimationFrame(updateTime);
    const timerId = window.setInterval(updateTime, 60_000);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearInterval(timerId);
    };
  }, []);

  const githubUrl = profile?.githubUrl || defaultProfile.githubUrl;
  const email = profile?.email || defaultProfile.email;
  const menuLinkClass = 'hidden rounded px-2 py-1 text-xs font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--card-bg)] hover:text-[var(--color-text)] xl:inline-flex';
  const systemIconClass = 'text-[var(--color-text-muted)]';

  return (
    <div
      className="fixed inset-x-0 top-0 z-[70] hidden h-10 border-b border-[var(--menubar-border)] bg-[var(--menubar-bg)] px-3 shadow-[var(--shadow-menubar)] backdrop-blur-[28px] md:block"
      role="menubar"
      aria-label="시스템 메뉴 막대"
    >
      <div className="flex h-full min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <Link
            href="/"
            className="mr-1 inline-flex h-7 shrink-0 items-center gap-1.5 rounded px-2 text-sm font-bold text-[var(--color-text)] transition hover:bg-[var(--card-bg)]"
          >
            <Command size={15} strokeWidth={2.4} />
            WYPark
          </Link>

          <div className="hidden min-w-0 items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold text-[var(--color-text-subtle)] sm:flex">
            <Monitor size={14} />
            <span className="truncate text-[var(--color-text-muted)]">{getAppTitle(pathname)}</span>
            <ChevronRight size={13} />
            <span className="truncate">{profile?.name || 'WYPark'}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a href={githubUrl} target="_blank" rel="noreferrer" className={menuLinkClass}>
            GitHub
          </a>
          <a href={`mailto:${email}`} className={menuLinkClass}>
            Email
          </a>
          <Search size={15} className={systemIconClass} />
          <Wifi size={15} className={systemIconClass} />
          <BatteryMedium size={17} className={systemIconClass} />
          <span className="hidden min-w-[8.5rem] text-right text-xs font-semibold tabular-nums text-[var(--color-text-muted)] lg:block">
            {formatMenuTime(now)}
          </span>
          <div className="scale-[0.88]">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
