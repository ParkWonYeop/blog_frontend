import Link from 'next/link';
import { Bot, ChevronRight } from 'lucide-react';
import ChessPageFrame from '@/features/chess/components/ChessPageFrame';

// 새 엔진을 붙이면 여기에 한 줄 추가하고 /chess/bot/<slug> 페이지를 만든다.
const ENGINES = [
  { slug: 'maia3', name: 'Maia3' },
] as const;

export default function ChessEngineList() {
  return (
    <ChessPageFrame title="봇" backHref="/chess" backLabel="체스">
      <ul className="border-t border-[var(--stroke-subtle)]">
        {ENGINES.map((engine) => (
          <li key={engine.slug} className="border-b border-[var(--stroke-subtle)]">
            <Link
              href={`/chess/bot/${engine.slug}`}
              className="-mx-2 flex min-h-16 min-w-0 items-center justify-between gap-3 rounded-xl px-2 transition-colors hover:bg-[var(--color-hover)]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Bot size={22} strokeWidth={1.8} className="shrink-0 text-[var(--color-text)]" />
                <span className="truncate text-body1 font-semibold text-[var(--color-text)]">{engine.name}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-[var(--color-text-placeholder)]" />
            </Link>
          </li>
        ))}
      </ul>
    </ChessPageFrame>
  );
}
