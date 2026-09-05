import Link from 'next/link';
import { Bot, Globe, History, Puzzle } from 'lucide-react';
import ChessPageFrame from '@/features/chess/components/ChessPageFrame';
import WindowSurface from '@/shared/ui/WindowSurface';

const tileClass =
  'flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-6 text-center shadow-[var(--shadow-card)] backdrop-blur-[20px]';

const activeTileClass =
  `${tileClass} transition duration-150 hover:-translate-y-0.5 hover:border-[var(--card-border-hover)] hover:bg-[var(--card-bg-strong)] hover:shadow-[var(--shadow-control)] focus-visible:-translate-y-0.5 focus-visible:border-[var(--color-accent)]`;

const iconClass =
  'flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-[var(--shadow-control)]';

export default function ChessHub() {
  return (
    <ChessPageFrame title="체스">
      <WindowSurface title="Chess" showTrafficLights={false} bodyClassName="p-4 md:p-6">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/chess/online" className={activeTileClass}>
            <span className={iconClass}>
              <Globe size={28} />
            </span>
            <span className="text-base font-bold text-[var(--color-text)]">Online</span>
          </Link>
          <Link href="/chess/bot" className={activeTileClass}>
            <span className={iconClass}>
              <Bot size={28} />
            </span>
            <span className="text-base font-bold text-[var(--color-text)]">BOT</span>
          </Link>
          <Link href="/play/chess" className={activeTileClass}>
            <span className={iconClass}>
              <Puzzle size={28} />
            </span>
            <span className="text-base font-bold text-[var(--color-text)]">Puzzle</span>
          </Link>
          <Link href="/chess/history" className={activeTileClass}>
            <span className={iconClass}>
              <History size={28} />
            </span>
            <span className="text-base font-bold text-[var(--color-text)]">History</span>
          </Link>
        </div>
      </WindowSurface>
    </ChessPageFrame>
  );
}
