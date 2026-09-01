'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Chess as ChessGame, type Move, type Square } from 'chess.js';
import { clsx } from 'clsx';
import {
  AlertCircle,
  ChevronLeft,
  Clipboard,
  Flag,
  History,
  Home,
  Loader2,
  PlusCircle,
  RotateCcw,
  Swords,
  Undo2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getChessGame, postChessMove, resignChessGame, undoChessMove } from '@/features/chess/api';
import ChessBoard, { getMoveSquares, getTurnLabel, toChessJsColor, type MoveSquares } from '@/features/chess/components/ChessBoard';
import { getChessErrorMessage, getChessOutcomeLabel, isAuthError, outcomeBadgeTones } from '@/features/chess/components/chessUi';
import StatusBadge from '@/shared/ui/StatusBadge';
import WindowSurface from '@/shared/ui/WindowSurface';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useAuthStore } from '@/features/auth/store';
import type { ChessColor, ChessGameResponse } from '@/shared/types';

interface ChessGamePlayClientProps {
  gameId: string;
}

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const createGame = (fen: string) => {
  try {
    return new ChessGame(fen);
  } catch {
    return null;
  }
};

const getPreferredMove = (moves: Move[], to: Square) => {
  const candidates = moves.filter((move) => move.to === to);

  return candidates.find((move) => move.promotion === 'q') ?? candidates[0] ?? null;
};

const toUciMove = (move: Move) => `${move.from}${move.to}${move.promotion ?? ''}`;

const hasPlayerMoved = (moves: string[], playerColor: ChessColor) => {
  return moves.some((_, index) => {
    const side = index % 2 === 0 ? 'white' : 'black';

    return side === playerColor;
  });
};

function ChessPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1180px] flex-col gap-5 px-0 py-3 md:py-6">
      {children}
    </div>
  );
}

function LoadingState({ message = '대국을 불러오는 중입니다.' }: { message?: string }) {
  return (
    <ChessPageFrame>
      <WindowSurface title="Maia Chess" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <Loader2 className="mb-3 animate-spin text-[var(--color-accent)]" size={30} />
        <p className="text-sm font-semibold text-[var(--color-text)]">{message}</p>
      </WindowSurface>
    </ChessPageFrame>
  );
}

function LoginRequired() {
  return (
    <ChessPageFrame>
      <WindowSurface title="Maia Chess" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="mb-3 text-amber-500" size={30} />
        <h1 className="break-words text-2xl font-bold tracking-normal text-[var(--color-text)]">로그인이 필요합니다.</h1>
        <p className="mt-2 max-w-md break-words text-sm leading-6 text-[var(--color-text-muted)]">
          Maia 대국은 로그인한 계정의 기록으로 저장됩니다.
        </p>
        <Link
          href="/login?redirect=/chess"
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
      <WindowSurface title="Maia Chess" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="mb-3 text-red-500" size={30} />
        <h1 className="break-words text-2xl font-bold tracking-normal text-[var(--color-text)]">대국을 불러오지 못했습니다.</h1>
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

function GameInfoPanel({
  game,
  isPlayerTurn,
  pending,
  canUndo,
  canResign,
  onCopyPgn,
  onUndo,
  onResign,
}: {
  game: ChessGameResponse;
  isPlayerTurn: boolean;
  pending: boolean;
  canUndo: boolean;
  canResign: boolean;
  onCopyPgn: () => void;
  onUndo: () => void;
  onResign: () => void;
}) {
  const gameEnded = game.status !== 'IN_PROGRESS';

  return (
    <WindowSurface title="Game Info" showTrafficLights={false} as="aside" bodyClassName="p-4 md:p-5">
      <div className="mb-4 flex min-w-0 flex-wrap items-center gap-2">
        <StatusBadge tone={outcomeBadgeTones[game.outcome]}>{getChessOutcomeLabel(game.outcome, game.status)}</StatusBadge>
        {game.result && <StatusBadge tone="neutral">{game.result}</StatusBadge>}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="min-w-0 rounded-lg bg-black/[0.025] px-3 py-2 dark:bg-white/[0.06]">
          <dt className="text-xs text-[var(--color-text-subtle)]">레이팅</dt>
          <dd className="mt-0.5 truncate font-semibold text-[var(--color-text)]">{game.rating}</dd>
        </div>
        <div className="min-w-0 rounded-lg bg-black/[0.025] px-3 py-2 dark:bg-white/[0.06]">
          <dt className="text-xs text-[var(--color-text-subtle)]">모델</dt>
          <dd className="mt-0.5 truncate font-semibold text-[var(--color-text)]">Maia {game.model}</dd>
        </div>
        <div className="min-w-0 rounded-lg bg-black/[0.025] px-3 py-2 dark:bg-white/[0.06]">
          <dt className="text-xs text-[var(--color-text-subtle)]">내 색상</dt>
          <dd className="mt-0.5 truncate font-semibold text-[var(--color-text)]">{getTurnLabel(game.playerColor)}</dd>
        </div>
        <div className="min-w-0 rounded-lg bg-black/[0.025] px-3 py-2 dark:bg-white/[0.06]">
          <dt className="text-xs text-[var(--color-text-subtle)]">현재 차례</dt>
          <dd className="mt-0.5 truncate font-semibold text-[var(--color-text)]">{getTurnLabel(game.turn)}</dd>
        </div>
      </dl>

      <div
        className={clsx(
          'mt-4 rounded-lg border px-3 py-3 text-sm font-semibold leading-6',
          gameEnded && 'border-[var(--color-line)] bg-black/[0.025] text-[var(--color-text-muted)] dark:bg-white/[0.06]',
          !gameEnded && isPlayerTurn && !pending && 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
          !gameEnded && (!isPlayerTurn || pending) && 'border-[var(--color-line)] bg-black/[0.025] text-[var(--color-text-muted)] dark:bg-white/[0.06]',
        )}
      >
        {gameEnded && '종료된 대국입니다.'}
        {!gameEnded && pending && '요청을 처리하는 중입니다.'}
        {!gameEnded && !pending && isPlayerTurn && '내 차례입니다. 말을 움직이세요.'}
        {!gameEnded && !pending && !isPlayerTurn && 'Maia 차례입니다.'}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1">
        {game.status === 'IN_PROGRESS' && (
          <>
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Undo2 size={16} />
              무르기
            </button>
            <button
              type="button"
              onClick={onResign}
              disabled={!canResign}
              className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-sm font-semibold text-red-700 shadow-[var(--shadow-control)] transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300"
            >
              <Flag size={16} />
              기권
            </button>
          </>
        )}
        <Link
          href="/chess"
          className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-3 text-sm font-semibold text-white shadow-[var(--shadow-control)] transition hover:bg-[var(--color-accent-hover)]"
        >
          <PlusCircle size={16} />
          새 게임
        </Link>
      </div>

      <div className="mt-4 rounded-lg border border-[var(--color-line)] bg-black/[0.025] px-3 py-3 dark:bg-white/[0.06]">
        <p className="text-xs font-semibold text-[var(--color-text-subtle)]">마지막 Maia 수</p>
        <p className="mt-1 break-words font-mono text-sm font-semibold text-[var(--color-text)]">
          {game.maiaMove || '아직 없음'}
        </p>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
          <p className="text-sm font-bold text-[var(--color-text)]">PGN</p>
          <button
            type="button"
            onClick={onCopyPgn}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-xs font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
          >
            <Clipboard size={14} />
            복사
          </button>
        </div>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] p-3 text-xs leading-5 text-[var(--color-text-muted)]">
          {game.pgn || 'PGN이 아직 없습니다.'}
        </pre>
      </div>
    </WindowSurface>
  );
}

export default function ChessGamePlayClient({ gameId }: ChessGamePlayClientProps) {
  const queryClient = useQueryClient();
  const { isLoggedIn, _hasHydrated } = useAuthStore();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [optimisticFen, setOptimisticFen] = useState<string | null>(null);
  const [optimisticMoveSquares, setOptimisticMoveSquares] = useState<MoveSquares | null>(null);
  const gameQueryKey = useMemo(() => queryKeys.chess.game(gameId), [gameId]);

  const gameQuery = useQuery({
    queryKey: gameQueryKey,
    queryFn: () => getChessGame(gameId),
    enabled: _hasHydrated && isLoggedIn,
    retry: 0,
  });

  const syncUpdatedGame = async (updatedGame: ChessGameResponse) => {
    queryClient.setQueryData(gameQueryKey, updatedGame);
    setOptimisticFen(null);
    setOptimisticMoveSquares(null);
    setSelectedSquare(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.chess.games.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.chess.stats }),
    ]);
  };

  const moveMutation = useMutation({
    mutationFn: (move: string) => postChessMove(gameId, { move }),
    onSuccess: async (updatedGame) => {
      await syncUpdatedGame(updatedGame);
    },
    onError: (error) => {
      setOptimisticFen(null);
      setOptimisticMoveSquares(null);
      setSelectedSquare(null);
      toast.error(getChessErrorMessage(error, '봇 응답을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.'));
      void gameQuery.refetch();
    },
  });

  const undoMutation = useMutation({
    mutationFn: () => undoChessMove(gameId),
    onSuccess: async (updatedGame) => {
      await syncUpdatedGame(updatedGame);
      toast.success('무르기를 적용했습니다.');
    },
    onError: (error) => {
      setOptimisticFen(null);
      setOptimisticMoveSquares(null);
      setSelectedSquare(null);
      toast.error(getChessErrorMessage(error, '무르기를 처리하지 못했습니다.'));
      void gameQuery.refetch();
    },
  });

  const resignMutation = useMutation({
    mutationFn: () => resignChessGame(gameId),
    onSuccess: async (updatedGame) => {
      await syncUpdatedGame(updatedGame);
      toast.success('기권 처리되었습니다.');
    },
    onError: (error) => {
      setOptimisticFen(null);
      setOptimisticMoveSquares(null);
      setSelectedSquare(null);
      toast.error(getChessErrorMessage(error, '기권을 처리하지 못했습니다.'));
      void gameQuery.refetch();
    },
  });

  const game = gameQuery.data;
  const isPending = moveMutation.isPending || undoMutation.isPending || resignMutation.isPending;
  const currentFen = optimisticFen ?? game?.fen ?? INITIAL_FEN;
  const localGame = useMemo(() => createGame(currentFen), [currentFen]);
  const playerColor = game ? toChessJsColor(game.playerColor) : null;
  const canInteract =
    Boolean(game && localGame && playerColor) &&
    game?.status === 'IN_PROGRESS' &&
    game.turn === game.playerColor &&
    !isPending;

  const legalMoves = useMemo<Move[]>(() => {
    if (!localGame || !selectedSquare || !canInteract) return [];

    return localGame.moves({ square: selectedSquare, verbose: true });
  }, [canInteract, localGame, selectedSquare]);

  const legalTargets = useMemo(() => new Set(legalMoves.map((move) => move.to)), [legalMoves]);
  const serverLastMoveSquares = useMemo(() => getMoveSquares(game?.maiaMove ?? game?.moves.at(-1)), [game?.maiaMove, game?.moves]);
  const lastMoveSquares = optimisticMoveSquares ?? serverLastMoveSquares;

  const isOwnTurnPiece = (square: Square) => {
    if (!localGame || !playerColor || !canInteract) return false;

    const piece = localGame.get(square);

    return piece?.color === playerColor && piece.color === localGame.turn();
  };

  const attemptMove = (from: Square, to: Square) => {
    if (!game || !localGame || !canInteract || !isOwnTurnPiece(from)) return;

    const movesFromSquare = localGame.moves({ square: from, verbose: true });
    const candidate = getPreferredMove(movesFromSquare, to);

    if (!candidate) {
      setSelectedSquare(null);
      toast.error('그 칸으로는 이동할 수 없습니다.');
      return;
    }

    try {
      const nextGame = new ChessGame(currentFen);
      nextGame.move({
        from,
        to,
        promotion: candidate.promotion,
      });

      setOptimisticFen(nextGame.fen());
      setOptimisticMoveSquares({ from, to });
      setSelectedSquare(null);
      moveMutation.mutate(toUciMove(candidate));
    } catch {
      setOptimisticMoveSquares(null);
      toast.error('합법적인 수가 아닙니다.');
    }
  };

  const handleSquareClick = (square: Square) => {
    if (!localGame || !canInteract) return;

    const piece = localGame.get(square);
    const isSelectablePiece = piece?.color === playerColor && piece.color === localGame.turn();

    if (!selectedSquare) {
      if (isSelectablePiece) setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (legalTargets.has(square)) {
      attemptMove(selectedSquare, square);
      return;
    }

    if (isSelectablePiece) {
      setSelectedSquare(square);
      return;
    }

    setSelectedSquare(null);
  };

  const copyPgn = () => {
    if (!game?.pgn) {
      toast.error('복사할 PGN이 없습니다.');
      return;
    }

    void navigator.clipboard.writeText(game.pgn)
      .then(() => toast.success('PGN을 복사했습니다.'))
      .catch(() => toast.error('PGN 복사에 실패했습니다.'));
  };

  const canResign = Boolean(game && game.status === 'IN_PROGRESS' && !isPending);
  const canUndo = Boolean(game && game.status === 'IN_PROGRESS' && !isPending && hasPlayerMoved(game.moves, game.playerColor));
  const pendingLabel = resignMutation.isPending
    ? '기권 처리 중'
    : undoMutation.isPending
      ? '무르기 처리 중'
      : moveMutation.isPending
        ? 'Maia 생각 중'
        : '';

  const handleUndo = () => {
    if (!canUndo) return;

    undoMutation.mutate();
  };

  const handleResign = () => {
    if (!canResign) return;
    if (!window.confirm('정말 기권하시겠습니까? 이 대국은 패배로 종료됩니다.')) return;

    resignMutation.mutate();
  };

  if (!_hasHydrated) return <LoadingState message="로그인 상태를 확인하는 중입니다." />;
  if (!isLoggedIn) return <LoginRequired />;
  if (gameQuery.isLoading) return <LoadingState />;
  if (gameQuery.isError) {
    if (isAuthError(gameQuery.error)) return <LoginRequired />;

    return (
      <ErrorState
        message={getChessErrorMessage(gameQuery.error, '대국 상세를 불러오지 못했습니다.')}
        onRetry={() => void gameQuery.refetch()}
      />
    );
  }

  if (!game) {
    return (
      <ErrorState
        message="대국 정보를 찾을 수 없습니다."
        onRetry={() => void gameQuery.refetch()}
      />
    );
  }

  const isPlayerTurn = game.status === 'IN_PROGRESS' && game.turn === game.playerColor;

  return (
    <ChessPageFrame>
      <section className="flex min-w-0 flex-col gap-3 border-b border-[var(--color-line)] pb-5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-[var(--color-accent)]">
            <Swords size={24} className="shrink-0" />
            <h1 className="min-w-0 break-words text-2xl font-bold tracking-normal text-[var(--color-text)] md:text-3xl">
              Maia 대국
            </h1>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/chess"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
            >
              <Home size={16} />
              로비
            </Link>
            <Link
              href="/chess/history"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
            >
              <History size={16} />
              기록
            </Link>
          </div>
        </div>
        <Link
          href="/chess"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--color-text-subtle)] transition hover:text-[var(--color-accent)]"
        >
          <ChevronLeft size={15} />
          새 대국 설정으로 돌아가기
        </Link>
      </section>

      <section className="grid min-w-0 items-start justify-center gap-5 xl:grid-cols-[minmax(0,30rem)_22rem]">
        <WindowSurface
          title="Board"
          subtitle={isPending ? 'Updating' : isPlayerTurn ? 'Your move' : 'Synced'}
          showTrafficLights={false}
          bodyClassName="p-2 md:p-3"
        >
          <div className="relative mx-auto max-w-full" style={{ width: 'min(100%, clamp(19rem, min(52vw, calc(100svh - 22.5rem)), 30rem))' }}>
            <ChessBoard
              fen={currentFen}
              orientation={game.playerColor}
              selectedSquare={selectedSquare}
              legalTargets={legalTargets}
              lastMoveSquares={lastMoveSquares}
              disabled={!canInteract}
              isDraggableSquare={isOwnTurnPiece}
              onSquareClick={handleSquareClick}
              onSquareDrop={attemptMove}
            />
            {isPending && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2">
                <div className="flex items-center gap-2 rounded-full border border-white/25 bg-black/62 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgb(0_0_0_/_0.28)] backdrop-blur-md">
                  <Loader2 className="animate-spin" size={16} />
                  {pendingLabel || '처리 중'}
                </div>
              </div>
            )}
          </div>
        </WindowSurface>

        <GameInfoPanel
          game={game}
          isPlayerTurn={isPlayerTurn}
          pending={isPending}
          canUndo={canUndo}
          canResign={canResign}
          onCopyPgn={copyPgn}
          onUndo={handleUndo}
          onResign={handleResign}
        />
      </section>
    </ChessPageFrame>
  );
}
