'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Bot, ChevronRight, Home, Loader2, RotateCcw, Swords } from 'lucide-react';
import { getChessGames } from '@/features/chess/api';
import { getTurnLabel } from '@/features/chess/components/ChessBoard';
import {
  formatChessDateTime,
  getChessErrorMessage,
  getChessOutcomeLabel,
  isAuthError,
  outcomeBadgeTones,
  type OutcomeFilter,
} from '@/features/chess/components/chessUi';
import SegmentedControl, { SegmentedControlOption } from '@/shared/ui/SegmentedControl';
import StatusBadge from '@/shared/ui/StatusBadge';
import WindowSurface from '@/shared/ui/WindowSurface';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useAuthStore } from '@/features/auth/store';
import type { ChessGameSummaryResponse } from '@/shared/types';

const FILTER_OPTIONS: readonly SegmentedControlOption<OutcomeFilter>[] = [
  { label: '전체', value: 'ALL' },
  { label: '진행중', value: 'IN_PROGRESS' },
  { label: '승', value: 'WIN' },
  { label: '패', value: 'LOSS' },
  { label: '무', value: 'DRAW' },
];

function ChessPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1160px] flex-col gap-5 px-0 py-3 md:py-6">
      {children}
    </div>
  );
}

function LoadingState({ message = '대국 기록을 불러오는 중입니다.' }: { message?: string }) {
  return (
    <ChessPageFrame>
      <WindowSurface title="Game History" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <Loader2 className="mb-3 animate-spin text-[var(--color-accent)]" size={30} />
        <p className="text-sm font-semibold text-[var(--color-text)]">{message}</p>
      </WindowSurface>
    </ChessPageFrame>
  );
}

function LoginRequired() {
  return (
    <ChessPageFrame>
      <WindowSurface title="Game History" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="mb-3 text-amber-500" size={30} />
        <h1 className="break-words text-2xl font-bold tracking-normal text-[var(--color-text)]">로그인이 필요합니다.</h1>
        <p className="mt-2 max-w-md break-words text-sm leading-6 text-[var(--color-text-muted)]">
          대국 기록은 로그인한 계정 기준으로 조회됩니다.
        </p>
        <Link
          href="/login?redirect=/chess/history"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
        >
          로그인
        </Link>
      </WindowSurface>
    </ChessPageFrame>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <ChessPageFrame>
      <WindowSurface title="Game History" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="mb-3 text-red-500" size={30} />
        <h1 className="break-words text-2xl font-bold tracking-normal text-[var(--color-text)]">기록을 불러오지 못했습니다.</h1>
        <p className="mt-2 max-w-md break-words text-sm leading-6 text-[var(--color-text-muted)]">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-4 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
        >
          <RotateCcw size={16} />
          다시 시도
        </button>
      </WindowSurface>
    </ChessPageFrame>
  );
}

function HistoryRow({ game }: { game: ChessGameSummaryResponse }) {
  return (
    <Link
      href={`/chess/play/${game.gameId}`}
      className="group grid min-w-0 gap-3 rounded-lg px-3 py-4 transition hover:bg-[var(--card-bg)] md:grid-cols-[minmax(0,1fr)_8rem_8rem_7rem_1.25rem] md:items-center"
    >
      <div className="min-w-0">
        <div className="mb-1.5 flex min-w-0 flex-wrap items-center gap-2">
          <StatusBadge tone={outcomeBadgeTones[game.outcome]}>{getChessOutcomeLabel(game.outcome, game.status)}</StatusBadge>
          {game.result && <StatusBadge tone="neutral">{game.result}</StatusBadge>}
        </div>
        <p className="truncate text-sm font-bold text-[var(--color-text)]">
          Maia {game.model} · 레이팅 {game.rating}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--color-text-subtle)]">
          업데이트 {formatChessDateTime(game.updatedAt)}
        </p>
      </div>

      <div className="min-w-0 text-sm md:text-right">
        <p className="text-xs text-[var(--color-text-subtle)] md:hidden">내 색상</p>
        <p className="font-semibold text-[var(--color-text-muted)]">{getTurnLabel(game.playerColor)}</p>
      </div>
      <div className="min-w-0 text-sm md:text-right">
        <p className="text-xs text-[var(--color-text-subtle)] md:hidden">수</p>
        <p className="font-semibold tabular-nums text-[var(--color-text-muted)]">{game.movesCount.toLocaleString()}수</p>
      </div>
      <div className="min-w-0 text-sm md:text-right">
        <p className="text-xs text-[var(--color-text-subtle)] md:hidden">생성</p>
        <p className="truncate font-semibold text-[var(--color-text-muted)]">{formatChessDateTime(game.createdAt)}</p>
      </div>
      <ChevronRight size={17} className="hidden text-[var(--color-text-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)] md:block" />
    </Link>
  );
}

export default function ChessHistoryClient() {
  const { isLoggedIn, _hasHydrated } = useAuthStore();
  const [filter, setFilter] = useState<OutcomeFilter>('ALL');

  const gamesQuery = useQuery({
    queryKey: queryKeys.chess.games.list({ page: 0, size: 100, sort: 'updatedAt,desc' }),
    queryFn: () => getChessGames({ page: 0, size: 100, sort: 'updatedAt,desc' }),
    enabled: _hasHydrated && isLoggedIn,
    retry: 0,
  });

  const games = useMemo(() => gamesQuery.data?.content ?? [], [gamesQuery.data?.content]);
  const filteredGames = useMemo(() => {
    if (filter === 'ALL') return games;

    return games.filter((game) => game.outcome === filter);
  }, [filter, games]);

  if (!_hasHydrated) return <LoadingState message="로그인 상태를 확인하는 중입니다." />;
  if (!isLoggedIn) return <LoginRequired />;
  if (gamesQuery.isLoading) return <LoadingState />;
  if (gamesQuery.isError) {
    if (isAuthError(gamesQuery.error)) return <LoginRequired />;

    return (
      <ErrorState
        message={getChessErrorMessage(gamesQuery.error, '대국 기록을 불러오지 못했습니다.')}
        onRetry={() => void gamesQuery.refetch()}
      />
    );
  }

  return (
    <ChessPageFrame>
      <section className="flex min-w-0 flex-col gap-3 border-b border-[var(--color-line)] pb-5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-[var(--color-accent)]">
            <Swords size={24} className="shrink-0" />
            <h1 className="min-w-0 break-words text-2xl font-bold tracking-normal text-[var(--color-text)] md:text-3xl">
              대국 기록
            </h1>
          </div>
          <Link
            href="/chess"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
          >
            <Home size={16} />
            로비
          </Link>
        </div>
        <p className="max-w-2xl break-words text-sm leading-6 text-[var(--color-text-muted)]">
          로그인한 계정의 Maia 대국 기록입니다. 항목을 열면 보드와 PGN을 볼 수 있습니다.
        </p>
      </section>

      <WindowSurface
        title="History"
        subtitle={`${filteredGames.length.toLocaleString()} / ${games.length.toLocaleString()} games`}
        showTrafficLights={false}
        controls={(
          <SegmentedControl
            ariaLabel="대국 결과 필터"
            options={FILTER_OPTIONS}
            value={filter}
            onChange={setFilter}
            className="max-w-[calc(100vw-3rem)] overflow-x-auto"
          />
        )}
        bodyClassName="p-3 md:p-4"
      >
        {filteredGames.length > 0 ? (
          <div className="divide-y divide-[var(--color-line)]">
            {filteredGames.map((game) => (
              <HistoryRow key={game.gameId} game={game} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center text-center">
            <Bot className="mb-3 text-[var(--color-accent)]" size={30} />
            <p className="text-sm font-semibold text-[var(--color-text)]">표시할 대국이 없습니다.</p>
            <p className="mt-1 text-xs text-[var(--color-text-subtle)]">필터를 바꾸거나 새 대국을 시작해보세요.</p>
          </div>
        )}
      </WindowSurface>
    </ChessPageFrame>
  );
}
