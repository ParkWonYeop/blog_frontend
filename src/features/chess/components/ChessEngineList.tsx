import Link from 'next/link';
import { Bot, ChevronRight } from 'lucide-react';
import ChessPageFrame from '@/features/chess/components/ChessPageFrame';
import WindowSurface from '@/shared/ui/WindowSurface';

// 새 엔진을 붙이면 여기에 한 줄 추가하고 /chess/bot/<slug> 페이지를 만든다.
const ENGINES = [
  { slug: 'maia3', name: 'Maia3' },
] as const;

export default function ChessEngineList() {
  return (
    <ChessPageFrame title="BOT" backHref="/chess" backLabel="체스">
      <WindowSurface title="Engines" showTrafficLights={false} bodyClassName="p-3 md:p-4">
        <ul className="divide-y divide-[var(--color-line)]">
          {ENGINES.map((engine) => (
            <li key={engine.slug}>
              <Link
                href={`/chess/bot/${engine.slug}`}
                className="group flex min-w-0 items-center justify-between gap-3 rounded-lg px-3 py-4 transition hover:bg-[var(--card-bg)]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-[var(--shadow-control)]">
                    <Bot size={22} />
                  </span>
                  <span className="truncate text-base font-bold text-[var(--color-text)]">{engine.name}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-[var(--color-text-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
              </Link>
            </li>
          ))}
        </ul>
      </WindowSurface>
    </ChessPageFrame>
  );
}
