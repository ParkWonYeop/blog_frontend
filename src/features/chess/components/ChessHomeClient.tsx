'use client';

import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  LockKeyhole,
  Play,
  Puzzle,
  Swords,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createChessGame, getChessGames, getChessGameStats } from '@/features/chess/api';
import { getTurnLabel } from '@/features/chess/components/ChessBoard';
import { formatChessDateTime, getChessErrorMessage, getChessOutcomeLabel, outcomeBadgeTones, outcomeLabels } from '@/features/chess/components/chessUi';
import MetricCard from '@/shared/ui/MetricCard';
import SegmentedControl, { SegmentedControlOption } from '@/shared/ui/SegmentedControl';
import StatusBadge from '@/shared/ui/StatusBadge';
import WindowSurface from '@/shared/ui/WindowSurface';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useAuthStore } from '@/features/auth/store';
import type { ChessColor, ChessGameCreateRequest, MaiaModel } from '@/shared/types';

type ChessFormState = Required<Pick<ChessGameCreateRequest, 'rating' | 'playerColor' | 'model' | 'temperature' | 'topP'>>;

const COLOR_OPTIONS: readonly SegmentedControlOption<ChessColor>[] = [
  { label: '백', value: 'white' },
  { label: '흑', value: 'black' },
];

const MODEL_OPTIONS: readonly SegmentedControlOption<MaiaModel>[] = [
  { label: '3m', value: '3m' },
  { label: '5m', value: '5m' },
  { label: '23m', value: '23m' },
  { label: '79m', value: '79m' },
];

const MODEL_HINTS: Record<MaiaModel, string> = {
  '3m': '가장 가볍고 빠른 실험용 모델',
  '5m': '가볍고 빠른 기본 모델',
  '23m': '더 사람다운 수, 응답이 조금 느림',
  '79m': '가장 정확하지만 가장 느리고 메모리를 많이 씀',
};

const RATING_PRESETS: readonly { label: string; value: number }[] = [
  { label: '입문 800', value: 800 },
  { label: '초급 1100', value: 1100 },
  { label: '중급 1500', value: 1500 },
  { label: '상급 1900', value: 1900 },
  { label: '고수 2300', value: 2300 },
];

const DEFAULT_FORM: ChessFormState = {
  rating: 1500,
  playerColor: 'white',
  model: '5m',
  temperature: 0.8,
  topP: 0.95,
};

const clampRating = (value: number) => Math.min(2600, Math.max(600, value));

function ChessPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1160px] flex-col gap-5 px-0 py-3 md:py-6">
      {children}
    </div>
  );
}

function LoadingGate() {
  return (
    <ChessPageFrame>
      <WindowSurface title="Maia Chess" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <Loader2 className="mb-3 animate-spin text-[var(--color-accent)]" size={30} />
        <p className="text-sm font-semibold text-[var(--color-text)]">로그인 상태를 확인하는 중입니다.</p>
      </WindowSurface>
    </ChessPageFrame>
  );
}

function LoginRequired() {
  return (
    <ChessPageFrame>
      <WindowSurface title="Maia Chess" showTrafficLights={false} bodyClassName="p-6 md:p-8">
        <div className="flex min-h-80 flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-[var(--shadow-control)]">
            <LockKeyhole size={30} />
          </div>
          <h1 className="break-words text-2xl font-bold tracking-normal text-[var(--color-text)]">로그인이 필요합니다.</h1>
          <p className="mt-2 max-w-md break-words text-sm leading-6 text-[var(--color-text-muted)]">
            Maia 봇과의 대국, 계정별 기록, PGN은 로그인한 사용자만 볼 수 있습니다.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/login?redirect=/chess"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
            >
              <LockKeyhole size={16} />
              로그인
            </Link>
            <Link
              href="/play/chess"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-4 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
            >
              <Puzzle size={16} />
              퍼즐 풀기
            </Link>
          </div>
        </div>
      </WindowSurface>
    </ChessPageFrame>
  );
}

function GameSummaryRow({
  game,
}: {
  game: {
    gameId: string;
    rating: number;
    playerColor: ChessColor;
    model: string;
    outcome: keyof typeof outcomeLabels;
    status: string;
    movesCount: number;
    updatedAt: string;
  };
}) {
  return (
    <Link
      href={`/chess/play/${game.gameId}`}
      className="group flex min-w-0 items-center justify-between gap-3 rounded-lg px-2 py-3 transition hover:bg-[var(--card-bg)]"
    >
      <div className="min-w-0">
        <div className="mb-1.5 flex min-w-0 flex-wrap items-center gap-2">
          <StatusBadge tone={outcomeBadgeTones[game.outcome]}>{getChessOutcomeLabel(game.outcome, game.status)}</StatusBadge>
          <span className="text-xs font-semibold text-[var(--color-text-subtle)]">
            Maia {game.model} · {game.rating}
          </span>
        </div>
        <p className="truncate text-sm font-semibold text-[var(--color-text)]">
          내 색상 {getTurnLabel(game.playerColor)} · {game.movesCount.toLocaleString()}수
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--color-text-subtle)]">{formatChessDateTime(game.updatedAt)}</p>
      </div>
      <ChevronRight size={17} className="shrink-0 text-[var(--color-text-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
    </Link>
  );
}

export default function ChessHomeClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, _hasHydrated } = useAuthStore();
  const [form, setForm] = useState<ChessFormState>(DEFAULT_FORM);

  const statsQuery = useQuery({
    queryKey: queryKeys.chess.stats,
    queryFn: getChessGameStats,
    enabled: _hasHydrated && isLoggedIn,
    retry: 0,
  });

  const gamesQuery = useQuery({
    queryKey: queryKeys.chess.games.list({ page: 0, size: 6, sort: 'updatedAt,desc' }),
    queryFn: () => getChessGames({ page: 0, size: 6, sort: 'updatedAt,desc' }),
    enabled: _hasHydrated && isLoggedIn,
    retry: 0,
  });

  const createMutation = useMutation({
    mutationFn: (payload: ChessGameCreateRequest) => createChessGame(payload),
    onSuccess: async (game) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.chess.games.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.chess.stats }),
      ]);
      router.push(`/chess/play/${game.gameId}`);
    },
    onError: (error) => {
      toast.error(getChessErrorMessage(error, '대국을 생성하지 못했습니다.'));
    },
  });

  const recentGames = gamesQuery.data?.content ?? [];
  const inProgressGame = recentGames.find((game) => game.outcome === 'IN_PROGRESS');
  const stats = statsQuery.data;
  const isLoadingData = statsQuery.isLoading || gamesQuery.isLoading;
  const hasDataError = statsQuery.isError || gamesQuery.isError;
  const dataErrorMessage = useMemo(() => {
    if (statsQuery.error) return getChessErrorMessage(statsQuery.error, '통계를 불러오지 못했습니다.');
    if (gamesQuery.error) return getChessErrorMessage(gamesQuery.error, '대국 기록을 불러오지 못했습니다.');
    return '';
  }, [gamesQuery.error, statsQuery.error]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  if (!_hasHydrated) return <LoadingGate />;
  if (!isLoggedIn) return <LoginRequired />;

  return (
    <ChessPageFrame>
      <section className="flex min-w-0 flex-col gap-2 border-b border-[var(--color-line)] pb-5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-[var(--color-accent)]">
            <Swords size={24} className="shrink-0" />
            <h1 className="min-w-0 break-words text-2xl font-bold tracking-normal text-[var(--color-text)] md:text-3xl">
              Maia 체스
            </h1>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/chess/history"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
            >
              <History size={16} />
              기록
            </Link>
            <Link
              href="/play/chess"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
            >
              <Puzzle size={16} />
              퍼즐
            </Link>
          </div>
        </div>
        <p className="max-w-2xl break-words text-sm leading-6 text-[var(--color-text-muted)]">
          레이팅과 색상을 고르고 Maia3 봇과 대국합니다. 최종 보드는 백엔드가 돌려준 FEN으로 동기화됩니다.
        </p>
      </section>

      <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="전체" value={stats?.total ?? (isLoadingData ? null : 0)} icon={<Trophy size={18} />} />
        <MetricCard label="진행중" value={stats?.inProgress ?? (isLoadingData ? null : 0)} icon={<Clock3 size={18} />} />
        <MetricCard label="승" value={stats?.wins ?? (isLoadingData ? null : 0)} />
        <MetricCard label="패" value={stats?.losses ?? (isLoadingData ? null : 0)} />
        <MetricCard label="무" value={stats?.draws ?? (isLoadingData ? null : 0)} />
      </section>

      {hasDataError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-300">
          {dataErrorMessage}
        </div>
      )}

      <section className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <WindowSurface title="New Game" showTrafficLights={false} bodyClassName="p-4 md:p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="chess-rating" className="text-sm font-semibold text-[var(--color-text)]">
                  레이팅
                </label>
                <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-sm font-bold tabular-nums text-[var(--color-accent)]">
                  {form.rating}
                </span>
              </div>
              <input
                id="chess-rating"
                type="range"
                min={600}
                max={2600}
                step={50}
                value={form.rating}
                onChange={(event) => setForm((previous) => ({ ...previous, rating: clampRating(Number(event.target.value)) }))}
                className="w-full accent-[var(--color-accent)]"
              />
              <input
                type="number"
                min={600}
                max={2600}
                step={50}
                value={form.rating}
                onChange={(event) => setForm((previous) => ({ ...previous, rating: clampRating(Number(event.target.value) || DEFAULT_FORM.rating) }))}
                className="mt-3 h-10 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
              />
              <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="레이팅 프리셋">
                {RATING_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    aria-pressed={form.rating === preset.value}
                    onClick={() => setForm((previous) => ({ ...previous, rating: preset.value }))}
                    className={clsx(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition',
                      form.rating === preset.value
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                        : 'border-[var(--control-border)] bg-[var(--color-control)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <p className="mb-2 text-sm font-semibold text-[var(--color-text)]">내 색상</p>
                <SegmentedControl
                  ariaLabel="내 색상"
                  options={COLOR_OPTIONS}
                  value={form.playerColor}
                  onChange={(playerColor) => setForm((previous) => ({ ...previous, playerColor }))}
                  className="w-full justify-center"
                />
              </div>
              <div className="min-w-0">
                <p className="mb-2 text-sm font-semibold text-[var(--color-text)]">모델</p>
                <SegmentedControl
                  ariaLabel="Maia 모델"
                  options={MODEL_OPTIONS}
                  value={form.model}
                  onChange={(model) => setForm((previous) => ({ ...previous, model }))}
                  className="w-full justify-center"
                />
                <p className="mt-2 text-xs text-[var(--color-text-subtle)]">{MODEL_HINTS[form.model]}</p>
              </div>
            </div>

            <details className="rounded-lg border border-[var(--color-line)] bg-black/[0.025] px-4 py-3 dark:bg-white/[0.06]">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--color-text-muted)]">
                고급 설정
              </summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="min-w-0 text-sm font-semibold text-[var(--color-text)]">
                  Temperature
                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.05}
                    value={form.temperature}
                    onChange={(event) => setForm((previous) => ({ ...previous, temperature: Number(event.target.value) }))}
                    className="mt-2 h-10 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
                  />
                </label>
                <label className="min-w-0 text-sm font-semibold text-[var(--color-text)]">
                  Top P
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={form.topP}
                    onChange={(event) => setForm((previous) => ({ ...previous, topP: Number(event.target.value) }))}
                    className="mt-2 h-10 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
                  />
                </label>
              </div>
            </details>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-bold text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Bot size={18} />}
              새 대국 시작
            </button>
          </form>
        </WindowSurface>

        <WindowSurface title="Recent Games" showTrafficLights={false} as="aside" bodyClassName="p-3 md:p-4">
          {gamesQuery.isLoading ? (
            <div className="flex min-h-56 flex-col items-center justify-center text-center">
              <Loader2 className="mb-3 animate-spin text-[var(--color-accent)]" size={26} />
              <p className="text-sm font-semibold text-[var(--color-text)]">기록을 불러오는 중입니다.</p>
            </div>
          ) : recentGames.length > 0 ? (
            <div className="divide-y divide-[var(--color-line)]">
              {inProgressGame && (
                <Link
                  href={`/chess/play/${inProgressGame.gameId}`}
                  className="mb-1 flex items-center justify-between gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/15 dark:text-emerald-300"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Play size={15} className="shrink-0" />
                    <span className="truncate">진행 중인 대국 이어서 두기</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium">{inProgressGame.movesCount}수 · Maia {inProgressGame.model}</span>
                </Link>
              )}
              {recentGames.map((game) => (
                <GameSummaryRow key={game.gameId} game={game} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center text-center">
              <Bot className="mb-3 text-[var(--color-accent)]" size={28} />
              <p className="text-sm font-semibold text-[var(--color-text)]">아직 대국 기록이 없습니다.</p>
              <p className="mt-1 text-xs text-[var(--color-text-subtle)]">첫 Maia 대국을 시작해보세요.</p>
            </div>
          )}
        </WindowSurface>
      </section>
    </ChessPageFrame>
  );
}
