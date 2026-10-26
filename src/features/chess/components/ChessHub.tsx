import Link from 'next/link';
import { Bot, Globe, History, Puzzle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ChessResumeGames from '@/features/chess/components/ChessResumeGames';
import ChessPageFrame from '@/features/chess/components/ChessPageFrame';

const MODES: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/chess/online', label: '온라인', icon: Globe },
  { href: '/chess/bot', label: '봇', icon: Bot },
  { href: '/play/chess', label: '퍼즐', icon: Puzzle },
  { href: '/chess/history', label: '기록', icon: History },
];

export default function ChessHub() {
  return (
    <ChessPageFrame title="체스">
      <ChessResumeGames />
      <div className="grid min-w-0 grid-cols-2 gap-2 px-2 sm:gap-3 sm:px-0 lg:grid-cols-4">
        {MODES.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-32 flex-col justify-between rounded-3xl bg-[var(--color-surface)] p-5 transition-colors hover:bg-[var(--color-surface-strong)] sm:min-h-44 sm:p-6"
          >
            <Icon size={28} strokeWidth={1.8} className="text-[var(--color-text)]" />
            <span className="text-title4 font-bold text-[var(--color-text)]">{label}</span>
          </Link>
        ))}
      </div>
    </ChessPageFrame>
  );
}
