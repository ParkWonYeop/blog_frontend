'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Bot, ChevronRight, Clock3, Loader2, RotateCcw, Trophy } from 'lucide-react';
import { getChessGameStats, getChessGames, getOnlineGames } from '@/features/chess/api';
import ChessPageFrame from '@/features/chess/components/ChessPageFrame';
import { getTerminationLabel } from '@/features/chess/lib';
import { getTurnLabel } from '@/features/chess/components/ChessBoard';
import {
  formatChessDateTime,
  getChessErrorMessage,
  getChessOutcomeLabel,
  isAuthError,
  outcomeBadgeTones,
  type OutcomeFilter,
} from '@/features/chess/components/chessUi';
import MetricCard from '@/shared/ui/MetricCard';
import SegmentedControl, { SegmentedControlOption } from '@/shared/ui/SegmentedControl';
import StatusBadge from '@/shared/ui/StatusBadge';
import WindowSurface from '@/shared/ui/WindowSurface';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useAuthStore } from '@/features/auth/store';
import type { ChessGameSummaryResponse, OnlineGameSummaryResponse } from '@/shared/types';

const FILTER_OPTIONS: readonly SegmentedControlOption<OutcomeFilter>[] = [
  { label: '전체', value: 'ALL' },
  { label: '진행중', value: 'IN_PROGRESS' },
  { label: '승', value: 'WIN' },
  { label: '패', value: 'LOSS' },
  { label: '무', value: 'DRAW' },
];

function LoadingState({ message = '대국 기록을 불러오는 중입니다.' }: { message?: string }) {
  return (
    <ChessPageFrame title="대국 기록" backHref="/chess" backLabel="체스">
      <WindowSurface title="History" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <Loader2 className="mb-3 animate-spin text-[var(--color-accent)]" size={30} />
        <p className="text-sm font-semibold text-[var(--color-text)]">{message}</p>
      </WindowSurface>
    </ChessPageFrame>
  );
}

function LoginRequired() {
  return (
    <ChessPageFrame title="대국 기록" backHref="/chess" backLabel="체스">
      <WindowSurface title="History" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="mb-3 text-amber-500" size={30} />
        <h1 className="break-words text-2xl font-bold tracking-normal text-[var(--color-text)]">로그인이 필요합니다.</h1>
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
    <ChessPageFrame title="대국 기록" backHref="/chess" backLabel="체스">
      <WindowSurface title="History" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
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
          Maia3 {game.model} · 레이팅 {game.rating}
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

function OnlineHistoryRow({ game }: { game: OnlineGameSummaryResponse }) {
  const when = new Date(game.finishedAt ?? game.startedAt).toISOString();

  return (
    <Link
      href={`/chess/online/${game.gameId}`}
      className="group grid min-w-0 gap-3 rounded-lg px-3 py-4 transition hover:bg-[var(--card-bg)] md:grid-cols-[minmax(0,1fr)_8rem_8rem_7rem_1.25rem] md:items-center"
    >
      <div className="min-w-0">
        <div className="mb-1.5 flex min-w-0 flex-wrap items-center gap-2">
          <StatusBadge tone={outcomeBadgeTones[game.outcome]}>{getChessOutcomeLabel(game.outcome, game.status)}</StatusBadge>
          {game.status !== 'IN_PROGRESS' && game.status !== 'ABORTED' && <StatusBadge tone="neutral">{getTerminationLabel(game.status)}</StatusBadge>}
          {game.result && <StatusBadge tone="neutral">{game.result}</StatusBadge>}
        </div>
        <p className="truncate text-sm font-bold text-[var(--color-text)]">
          vs {game.opponent} · {game.timeControl.label}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--color-text-subtle)]">{formatChessDateTime(when)}</p>
      </div>

      <div className="min-w-0 text-sm md:text-right">
        <p className="text-xs text-[var(--color-text-subtle)] md:hidden">내 색상</p>
        <p className="font-semibold text-[var(--color-text-muted)]">{getTurnLabel(game.myColor)}</p>
      </div>
      <div className="min-w-0 text-sm md:text-right">
        <p className="text-xs text-[var(--color-text-subtle)] md:hidden">수</p>
        <p className="font-semibold tabular-nums text-[var(--color-text-muted)]">{game.movesCount.toLocaleString()}수</p>
      </div>
      <div className="min-w-0 text-sm md:text-right">
        <p className="text-xs text-[var(--color-text-subtle)] md:hidden">상대</p>
        <p className="truncate font-semibold text-[var(--color-text-muted)]">{game.opponent}</p>
      </div>
      <ChevronRight size={17} className="hidden text-[var(--color-text-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)] md:block" />
    </Link>
  );
}

export default function ChessHistoryClient() {
  const { isLoggedIn, _hasHydrated } = useAuthStore();
  const [filter, setFilter] = useState<OutcomeFilter>('ALL');

  const statsQuery = useQuery({
    queryKey: queryKeys.chess.stats,
    queryFn: getChessGameStats,
    enabled: _hasHydrated && isLoggedIn,
    retry: 0,
  });

  const gamesQuery = useQuery({
    queryKey: queryKeys.chess.games.list({ page: 0, size: 100, sort: 'updatedAt,desc' }),
    queryFn: () => getChessGames({ page: 0, size: 100, sort: 'updatedAt,desc' }),
    enabled: _hasHydrated && isLoggedIn,
    retry: 0,
  });

  const onlineQuery = useQuery({
    queryKey: queryKeys.chess.online.list({ page: 0, size: 50 }),
    queryFn: () => getOnlineGames({ page: 0, size: 50 }),
    enabled: _hasHydrated && isLoggedIn,
    retry: 0,
  });

  const games = useMemo(() => gamesQuery.data?.content ?? [], [gamesQuery.data?.content]);
  const filteredGames = useMemo(() => {
    if (filter === 'ALL') return games;

    return games.filter((game) => game.outcome === filter);
  }, [filter, games]);
  const onlineGames = useMemo(() => onlineQuery.data?.content ?? [], [onlineQuery.data?.content]);
  const filteredOnlineGames = useMemo(() => {
    if (filter === 'ALL') return onlineGames;

    return onlineGames.filter((game) => game.outcome === filter);
  }, [filter, onlineGames]);

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

  const stats = statsQuery.data;
  const statValue = (value?: number) => value ?? (statsQuery.isLoading ? null : 0);

  return (
    <ChessPageFrame title="대국 기록" backHref="/chess" backLabel="체스">
      <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="전체" value={statValue(stats?.total)} icon={<Trophy size={18} />} />
        <MetricCard label="진행중" value={statValue(stats?.inProgress)} icon={<Clock3 size={18} />} />
        <MetricCard label="승" value={statValue(stats?.wins)} />
        <MetricCard label="패" value={statValue(stats?.losses)} />
        <MetricCard label="무" value={statValue(stats?.draws)} />
      </section>

      <WindowSurface
        title="Online"
        subtitle={`${filteredOnlineGames.length.toLocaleString()} / ${onlineGames.length.toLocaleString()} games`}
        showTrafficLights={false}
        bodyClassName="p-3 md:p-4"
      >
        {onlineQuery.isError ? (
          <p className="px-3 py-6 text-center text-sm font-semibold text-red-700 dark:text-red-300">
            {getChessErrorMessage(onlineQuery.error, '온라인 대국 기록을 불러오지 못했습니다.')}
          </p>
        ) : filteredOnlineGames.length > 0 ? (
          <div className="divide-y divide-[var(--color-line)]">
            {filteredOnlineGames.map((game) => (
              <OnlineHistoryRow key={game.gameId} game={game} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">표시할 온라인 대국이 없습니다.</p>
          </div>
        )}
      </WindowSurface>

      <WindowSurface
        title="Maia3"
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
          </div>
        )}
      </WindowSurface>
    </ChessPageFrame>
  );
}
