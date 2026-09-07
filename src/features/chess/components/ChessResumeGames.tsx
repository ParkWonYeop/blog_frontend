'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Play, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store';
import { getActiveChessGame, getActiveOnlineGame } from '@/features/chess/api';
import { queryKeys } from '@/shared/lib/queryKeys';
import Surface from '@/shared/ui/Surface';

export default function ChessResumeGames() {
  const { isLoggedIn, _hasHydrated } = useAuthStore();
  const enabled = _hasHydrated && isLoggedIn;
  const options = { enabled, retry: 0, staleTime: 0, gcTime: 0, refetchOnMount: 'always' as const, refetchOnWindowFocus: true };
  const online = useQuery({ ...options, queryKey: queryKeys.chess.online.active, queryFn: getActiveOnlineGame });
  const bot = useQuery({ ...options, queryKey: queryKeys.chess.games.active, queryFn: ({ signal }) => getActiveChessGame(signal) });
  if (!enabled) return null;

  const games = [
    ...(!online.isFetching && !online.isError && online.data?.status === 'IN_PROGRESS' ? [{ href: `/chess/online/${online.data.gameId}`, label: '온라인 대국 이어두기', description: `${online.data.white.nickname} · ${online.data.black.nickname} / ${online.data.timeControl.label}` }] : []),
    ...(!bot.isFetching && !bot.isError && bot.data ? [{ href: `/chess/play/${bot.data.gameId}`, label: '봇 대국 이어두기', description: `Maia3 · ${bot.data.rating} / ${bot.data.playerColor === 'white' ? '백' : '흑'}` }] : []),
  ];
  const loading = online.isFetching || bot.isFetching;
  const failed = online.isError || bot.isError;
  if (!games.length && !loading && !failed) return null;

  return (
    <Surface className="p-3 sm:p-4" aria-label="진행 중인 대국">
      <div className="grid gap-2">
        {games.map((game) => (
          <Link key={game.href} href={game.href} className="flex min-h-16 min-w-0 items-center gap-3 rounded-lg bg-[var(--color-accent-soft)] px-3 py-2 text-[var(--color-accent)] transition hover:brightness-95">
            <Play size={20} className="shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-bold">{game.label}</span>
              <span className="block truncate text-xs text-[var(--color-text-muted)]">{game.description}</span>
            </span>
          </Link>
        ))}
        {loading && <p role="status" className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]"><Loader2 size={14} className="animate-spin" />진행 중인 대국 확인 중</p>}
        {failed && !loading && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
            <span>일부 대국을 확인하지 못했습니다.</span>
            <button type="button" onClick={() => { if (online.isError) void online.refetch(); if (bot.isError) void bot.refetch(); }} className="inline-flex min-h-11 items-center gap-1.5 px-2 font-semibold"><RefreshCw size={14} />다시 확인</button>
          </div>
        )}
      </div>
    </Surface>
  );
}
