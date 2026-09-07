import Link from 'next/link';
import { Bot, Globe, History, Puzzle } from 'lucide-react';
import ChessResumeGames from '@/features/chess/components/ChessResumeGames';
import ChessPageFrame from '@/features/chess/components/ChessPageFrame';
import WindowSurface from '@/shared/ui/WindowSurface';

const tileClass =
  'flex min-h-28 sm:min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-4 sm:px-4 sm:py-6 text-center shadow-[var(--shadow-card)] backdrop-blur-[20px]';

const activeTileClass =
  `${tileClass} transition duration-150 hover:-translate-y-0.5 hover:border-[var(--card-border-hover)] hover:bg-[var(--card-bg-strong)] hover:shadow-[var(--shadow-control)] focus-visible:-translate-y-0.5 focus-visible:border-[var(--color-accent)]`;

const iconClass =
  'flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-[var(--shadow-control)]';

export default function ChessHub() {
  return (
    <ChessPageFrame title="체스">
      <ChessResumeGames />
      <WindowSurface title="Chess" showTrafficLights={false} bodyClassName="p-3 md:p-6">
        <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
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
