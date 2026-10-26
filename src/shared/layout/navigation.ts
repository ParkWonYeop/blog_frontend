import { Archive, Crown, Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: '홈', icon: Home, isActive: (pathname) => pathname === '/' },
  { href: '/archive', label: '아카이브', icon: Archive, isActive: (pathname) => pathname.startsWith('/archive') },
  {
    href: '/chess',
    label: '체스',
    icon: Crown,
    isActive: (pathname) => pathname.startsWith('/chess') || pathname.startsWith('/play/chess'),
  },
];

export const SIDEBAR_COLLAPSED_STORAGE_KEY = 'sidebar-collapsed';
