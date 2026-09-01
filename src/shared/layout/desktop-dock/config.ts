import type { LucideIcon } from 'lucide-react';

export interface DockAction {
  key: string;
  href?: string;
  label: string;
  icon: LucideIcon;
  isActive?: (pathname: string) => boolean;
  onClick?: () => void;
}

export const isActivePath = (target: string) => (pathname: string) => {
  if (target === '/') return pathname === '/';
  return pathname.startsWith(target);
};

export const DOCK_LEAVE_DELAY_MS = 120;
export const DOCK_COLLAPSE_MS = 560;
export const DOCK_PINNED_STORAGE_KEY = 'dock-pinned-v2';
