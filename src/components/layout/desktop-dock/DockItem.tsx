import Link from 'next/link';
import { clsx } from 'clsx';
import type { DockAction } from './config';
import { getDockToneStyle } from './styles';

interface DockItemProps {
  item: DockAction;
  pathname: string;
  activeOverride?: boolean;
  onNavigate?: () => void;
}

export function DesktopDockItem({ item, pathname, onNavigate }: DockItemProps) {
  const Icon = item.icon;
  const active = item.isActive?.(pathname) ?? false;
  const itemClass = clsx(
    'group/item relative flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--dock-item-border)] bg-[var(--dock-item-bg)] text-[var(--dock-item-fg)] shadow-[var(--shadow-control)] backdrop-blur-[18px] transition duration-150 hover:-translate-y-1 hover:border-[var(--dock-item-border-hover)] hover:bg-[var(--dock-item-bg-hover)] hover:text-[var(--dock-item-fg-strong)] focus-visible:-translate-y-1',
    active && 'border-[var(--dock-item-border-hover)] bg-[var(--dock-item-bg-active)] text-[var(--dock-item-fg-strong)] ring-1 ring-[var(--dock-item-ring)]',
  );
  const content = (
    <>
      <Icon size={20} strokeWidth={2.1} />
      <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-full border border-[var(--card-border)] bg-[var(--card-bg-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)] opacity-0 shadow-[var(--shadow-control)] backdrop-blur-[18px] transition group-hover/item:opacity-100">
        {item.label}
      </span>
      {active && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-[var(--dock-item-fg-strong)]" />}
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        title={item.label}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        className={itemClass}
        style={getDockToneStyle(item.key)}
        onClick={onNavigate}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      title={item.label}
      aria-label={item.label}
      onClick={item.onClick}
      className={itemClass}
      style={getDockToneStyle(item.key)}
    >
      {content}
    </button>
  );
}

export function MobileDockItem({
  item,
  pathname,
  activeOverride,
  onNavigate,
}: DockItemProps) {
  const Icon = item.icon;
  const active = activeOverride ?? item.isActive?.(pathname) ?? false;
  const itemClass = clsx(
    'flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border border-[var(--dock-item-border)] bg-[var(--dock-item-bg)] px-1 text-[10px] font-semibold leading-none text-[var(--dock-item-fg)] shadow-[var(--shadow-control)] backdrop-blur-[18px] transition-colors',
    'hover:border-[var(--dock-item-border-hover)] hover:bg-[var(--dock-item-bg-hover)] hover:text-[var(--dock-item-fg-strong)] focus-visible:bg-[var(--dock-item-bg-active)]',
    active && 'border-[var(--dock-item-border-hover)] bg-[var(--dock-item-bg-active)] text-[var(--dock-item-fg-strong)] ring-1 ring-[var(--dock-item-ring)]',
  );
  const content = (
    <>
      <Icon size={18} strokeWidth={2.1} />
      <span className="max-w-full truncate">{item.label}</span>
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        title={item.label}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        className={itemClass}
        style={getDockToneStyle(item.key)}
        onClick={onNavigate}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      title={item.label}
      aria-label={item.label}
      onClick={item.onClick}
      className={itemClass}
      style={getDockToneStyle(item.key)}
    >
      {content}
    </button>
  );
}
