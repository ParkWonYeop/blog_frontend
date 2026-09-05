'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Chess as ChessGame, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import { clsx } from 'clsx';
import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  Clipboard,
  Flag,
  History,
  Home,
  Loader2,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Swords,
  Undo2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createChessGame, getChessGame, postChessMove, resignChessGame, undoChessMove } from '@/features/chess/api';
import ChessBoard, { PIECE_SYMBOLS, getMoveSquares, getTurnLabel, toChessJsColor, type MoveSquares } from '@/features/chess/components/ChessBoard';
import ChessMoveList from '@/features/chess/components/ChessMoveList';
import ChessPromotionPicker from '@/features/chess/components/ChessPromotionPicker';
import { BOARD_SIZE_STYLE, getChessErrorMessage, getChessOutcomeLabel, isAuthError, outcomeBadgeTones } from '@/features/chess/components/chessUi';
import {
  START_FEN,
  getFenAtPly,
  getGameOverTitle,
  getKingInCheckSquare,
  getMaterial,
  getTerminationLabel,
  pickMoveToSquare,
  replayMoves,
  toUciMove,
  type PromotionPiece,
} from '@/features/chess/lib';
import StatusBadge from '@/shared/ui/StatusBadge';
import WindowSurface from '@/shared/ui/WindowSurface';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useAuthStore } from '@/features/auth/store';
import type { ChessColor, ChessGameResponse } from '@/shared/types';

interface ChessGamePlayClientProps {
  gameId: string;
}

type PendingPromotion = {
  from: Square;
  to: Square;
};

const createGame = (fen: string) => {
  try {
    return new ChessGame(fen);
  } catch {
    return null;
  }
};

const hasPlayerMoved = (moves: string[], playerColor: ChessColor) => {
  return moves.some((_, index) => {
    const side = index % 2 === 0 ? 'white' : 'black';

    return side === playerColor;
  });
};

const oppositeColor = (color: ChessColor): ChessColor => (color === 'white' ? 'black' : 'white');

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

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

function PlayerBar({
  name,
  color,
  captured,
  advantage,
  active,
  thinking,
}: {
  name: string;
  color: Color;
  captured: PieceSymbol[];
  advantage: number;
  active: boolean;
  thinking?: boolean;
}) {
  const capturedColor: Color = color === 'w' ? 'b' : 'w';

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 px-1 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={clsx(
            'h-2.5 w-2.5 shrink-0 rounded-full border',
            color === 'w' ? 'border-black/20 bg-white' : 'border-white/30 bg-[#151922]',
            active && 'ring-2 ring-emerald-500/60',
          )}
          aria-hidden="true"
        />
        <span className="truncate text-sm font-semibold text-[var(--color-text)]">{name}</span>
        {thinking && <Loader2 size={14} className="shrink-0 animate-spin text-[var(--color-text-subtle)]" aria-label="생각 중" />}
      </div>
      <div className="flex min-w-0 items-center gap-1 text-base leading-none text-[var(--color-text-muted)]" aria-label={captured.length ? `잡은 기물 ${captured.length}개` : undefined}>
        <span className="truncate font-serif">{captured.map((piece) => PIECE_SYMBOLS[capturedColor][piece]).join('')}</span>
        {advantage > 0 && <span className="text-xs font-bold tabular-nums text-[var(--color-text-subtle)]">+{advantage}</span>}
      </div>
    </div>
  );
}

function GameInfoPanel({
  game,
  isPlayerTurn,
  pending,
  canUndo,
  canResign,
  rematchPending,
  currentPly,
  history,
  onSelectPly,
  onCopyPgn,
  onUndo,
  onResign,
  onRematch,
}: {
  game: ChessGameResponse;
  isPlayerTurn: boolean;
  pending: boolean;
  canUndo: boolean;
  canResign: boolean;
  rematchPending: boolean;
  currentPly: number;
  history: ReturnType<typeof replayMoves>;
  onSelectPly: (ply: number) => void;
  onCopyPgn: () => void;
  onUndo: () => void;
  onResign: () => void;
  onRematch: (swapColor: boolean) => void;
}) {
  const gameEnded = game.status !== 'IN_PROGRESS';

  return (
    <WindowSurface title="Game Info" showTrafficLights={false} as="aside" bodyClassName="p-4 md:p-5">
      <div className="mb-4 flex min-w-0 flex-wrap items-center gap-2">
        <StatusBadge tone={outcomeBadgeTones[game.outcome]}>{getChessOutcomeLabel(game.outcome, game.status)}</StatusBadge>
        {gameEnded && <StatusBadge tone="neutral">{getTerminationLabel(game.status)}</StatusBadge>}
        {game.result && <StatusBadge tone="neutral">{game.result}</StatusBadge>}
      </div>

      {gameEnded ? (
        <div
          className={clsx(
            'rounded-lg border px-3 py-3',
            game.outcome === 'WIN' && 'border-emerald-500/25 bg-emerald-500/10',
            game.outcome === 'LOSS' && 'border-red-500/20 bg-red-500/10',
            game.outcome !== 'WIN' && game.outcome !== 'LOSS' && 'border-[var(--color-line)] bg-black/[0.025] dark:bg-white/[0.06]',
          )}
        >
          <p className="text-base font-bold text-[var(--color-text)]">{getGameOverTitle(game.outcome, game.status)}</p>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {getTerminationLabel(game.status)} · {history.length}수
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onRematch(false)}
              disabled={rematchPending}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rematchPending ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
              재대국
            </button>
            <button
              type="button"
              onClick={() => onRematch(true)}
              disabled={rematchPending}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-xs font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowUpDown size={14} />
              색 바꿔 재대국
            </button>
          </div>
        </div>
      ) : (
        <div
          className={clsx(
            'rounded-lg border px-3 py-3 text-sm font-semibold leading-6',
            isPlayerTurn && !pending && 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
            (!isPlayerTurn || pending) && 'border-[var(--color-line)] bg-black/[0.025] text-[var(--color-text-muted)] dark:bg-white/[0.06]',
          )}
        >
          {pending && '요청을 처리하는 중입니다.'}
          {!pending && isPlayerTurn && '내 차례입니다. 말을 움직이세요.'}
          {!pending && !isPlayerTurn && 'Maia 차례입니다.'}
        </div>
      )}

      <div className="mt-4">
        <ChessMoveList history={history} currentPly={currentPly} onSelectPly={onSelectPly} />
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

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
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

      <details className="mt-4 rounded-lg border border-[var(--color-line)] bg-black/[0.025] px-3 py-2 dark:bg-white/[0.06]">
        <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-[var(--color-text)]">
          PGN
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onCopyPgn();
            }}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-xs font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
          >
            <Clipboard size={14} />
            복사
          </button>
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] p-3 text-xs leading-5 text-[var(--color-text-muted)]">
          {game.pgn || 'PGN이 아직 없습니다.'}
        </pre>
      </details>
    </WindowSurface>
  );
}

export default function ChessGamePlayClient({ gameId }: ChessGamePlayClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, _hasHydrated } = useAuthStore();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [optimisticFen, setOptimisticFen] = useState<string | null>(null);
  const [optimisticMoveSquares, setOptimisticMoveSquares] = useState<MoveSquares | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  // null이면 현재 국면, 숫자면 그 수까지의 과거 국면을 보는 중
  const [viewPly, setViewPly] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);
  const gameQueryKey = useMemo(() => queryKeys.chess.game(gameId), [gameId]);

  const gameQuery = useQuery({
    queryKey: gameQueryKey,
    queryFn: () => getChessGame(gameId),
    enabled: _hasHydrated && isLoggedIn,
    retry: 0,
  });

  const resetLocalState = () => {
    setOptimisticFen(null);
    setOptimisticMoveSquares(null);
    setSelectedSquare(null);
    setPendingPromotion(null);
    setViewPly(null);
  };

  const syncUpdatedGame = async (updatedGame: ChessGameResponse) => {
    queryClient.setQueryData(gameQueryKey, updatedGame);
    resetLocalState();
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
      resetLocalState();
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
      resetLocalState();
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
      resetLocalState();
      toast.error(getChessErrorMessage(error, '기권을 처리하지 못했습니다.'));
      void gameQuery.refetch();
    },
  });

  const rematchMutation = useMutation({
    mutationFn: (swapColor: boolean) => {
      const current = gameQuery.data;
      if (!current) throw new Error('대국 정보를 찾을 수 없습니다.');

      return createChessGame({
        rating: current.rating,
        playerColor: swapColor ? oppositeColor(current.playerColor) : current.playerColor,
        model: current.model,
        temperature: current.temperature,
        topP: current.topP,
      });
    },
    onSuccess: async (newGame) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.chess.games.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.chess.stats }),
      ]);
      router.push(`/chess/play/${newGame.gameId}`);
    },
    onError: (error) => {
      toast.error(getChessErrorMessage(error, '재대국을 만들지 못했습니다.'));
    },
  });

  const game = gameQuery.data;
  const isPending = moveMutation.isPending || undoMutation.isPending || resignMutation.isPending;
  const history = useMemo(() => replayMoves(game?.moves ?? []), [game?.moves]);
  const livePly = history.length;
  const isReviewing = viewPly !== null && viewPly < livePly;
  const currentPly = isReviewing ? viewPly : livePly;
  const liveFen = optimisticFen ?? game?.fen ?? START_FEN;
  const displayFen = isReviewing ? getFenAtPly(history, viewPly) : liveFen;
  const displayGame = useMemo(() => createGame(displayFen), [displayFen]);
  const playerColor = game ? toChessJsColor(game.playerColor) : null;
  const canInteract =
    Boolean(game && displayGame && playerColor) &&
    game?.status === 'IN_PROGRESS' &&
    game.turn === game.playerColor &&
    !isPending &&
    !isReviewing &&
    !pendingPromotion;

  const legalMoves = useMemo<Move[]>(() => {
    if (!displayGame || !selectedSquare || !canInteract) return [];

    return displayGame.moves({ square: selectedSquare, verbose: true });
  }, [canInteract, displayGame, selectedSquare]);

  const legalTargets = useMemo(() => new Set(legalMoves.map((move) => move.to)), [legalMoves]);
  const serverLastMoveSquares = useMemo(() => getMoveSquares(game?.maiaMove ?? game?.moves.at(-1)), [game?.maiaMove, game?.moves]);
  const reviewedEntry = isReviewing && viewPly > 0 ? history[viewPly - 1] : null;
  const lastMoveSquares = isReviewing
    ? reviewedEntry
      ? { from: reviewedEntry.from, to: reviewedEntry.to }
      : null
    : optimisticMoveSquares ?? serverLastMoveSquares;
  const checkSquare = useMemo(() => getKingInCheckSquare(displayGame), [displayGame]);
  const material = useMemo(() => getMaterial(displayFen), [displayFen]);
  const orientation: ChessColor = game ? (flipped ? oppositeColor(game.playerColor) : game.playerColor) : 'white';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

      const goTo = (ply: number) => {
        event.preventDefault();
        setSelectedSquare(null);
        setViewPly(Math.min(Math.max(ply, 0), livePly));
      };

      switch (event.key) {
        case 'ArrowLeft':
          goTo(currentPly - 1);
          break;
        case 'ArrowRight':
          goTo(currentPly + 1);
          break;
        case 'Home':
          goTo(0);
          break;
        case 'End':
          goTo(livePly);
          break;
        case 'f':
        case 'F':
          setFlipped((previous) => !previous);
          break;
        default:
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPly, livePly]);

  const isOwnTurnPiece = (square: Square) => {
    if (!displayGame || !playerColor || !canInteract) return false;

    const piece = displayGame.get(square);

    return piece?.color === playerColor && piece.color === displayGame.turn();
  };

  const commitMove = (move: Move) => {
    try {
      const nextGame = new ChessGame(liveFen);
      nextGame.move({ from: move.from, to: move.to, promotion: move.promotion });

      setOptimisticFen(nextGame.fen());
      setOptimisticMoveSquares({ from: move.from, to: move.to });
      setSelectedSquare(null);
      setPendingPromotion(null);
      moveMutation.mutate(toUciMove(move));
    } catch {
      setOptimisticMoveSquares(null);
      setPendingPromotion(null);
      toast.error('합법적인 수가 아닙니다.');
    }
  };

  const attemptMove = (from: Square, to: Square) => {
    if (!game || !displayGame || !canInteract || !isOwnTurnPiece(from)) return;

    const { move, needsPromotion } = pickMoveToSquare(displayGame.moves({ square: from, verbose: true }), to);

    if (needsPromotion) {
      setSelectedSquare(null);
      setPendingPromotion({ from, to });
      return;
    }

    if (!move) {
      setSelectedSquare(null);
      toast.error('그 칸으로는 이동할 수 없습니다.');
      return;
    }

    commitMove(move);
  };

  const handlePromotion = (piece: PromotionPiece) => {
    if (!pendingPromotion || !displayGame) return;

    const move = displayGame
      .moves({ square: pendingPromotion.from, verbose: true })
      .find((candidate) => candidate.to === pendingPromotion.to && candidate.promotion === piece);

    if (!move) {
      setPendingPromotion(null);
      toast.error('합법적인 수가 아닙니다.');
      return;
    }

    commitMove(move);
  };

  const handleSquareClick = (square: Square) => {
    if (isReviewing) {
      setViewPly(null);
      return;
    }
    if (!displayGame || !canInteract) return;

    const piece = displayGame.get(square);
    const isSelectablePiece = piece?.color === playerColor && piece.color === displayGame.turn();

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

  const handleSelectPly = (ply: number) => {
    setSelectedSquare(null);
    setViewPly(ply >= livePly ? null : Math.max(ply, 0));
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
  const maiaName = `Maia ${game.model} · ${game.rating}`;
  const topColor: Color = orientation === 'white' ? 'b' : 'w';
  const bottomColor: Color = orientation === 'white' ? 'w' : 'b';
  const displayTurn = displayGame?.turn() ?? toChessJsColor(game.turn);
  const barFor = (color: Color, position: 'top' | 'bottom') => {
    const isPlayer = color === playerColor;
    const inProgress = game.status === 'IN_PROGRESS' && !isReviewing;

    return (
      <PlayerBar
        key={position}
        name={isPlayer ? '나' : maiaName}
        color={color}
        captured={color === 'w' ? material.capturedByWhite : material.capturedByBlack}
        advantage={color === 'w' ? material.whiteAdvantage : -material.whiteAdvantage}
        active={displayTurn === color}
        thinking={!isPlayer && inProgress && moveMutation.isPending}
      />
    );
  };
  const boardSubtitle = isReviewing
    ? `Reviewing ${currentPly} / ${livePly}`
    : isPending
      ? 'Updating'
      : isPlayerTurn
        ? checkSquare
          ? 'Check!'
          : 'Your move'
        : 'Synced';

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

      <section className="grid min-w-0 items-start justify-center gap-5 xl:grid-cols-[minmax(0,40rem)_22rem]">
        <WindowSurface
          title="Board"
          subtitle={boardSubtitle}
          showTrafficLights={false}
          controls={(
            <button
              type="button"
              onClick={() => setFlipped((previous) => !previous)}
              aria-pressed={flipped}
              aria-label="보드 뒤집기"
              title="보드 뒤집기 (F)"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
            >
              <ArrowUpDown size={15} />
            </button>
          )}
          bodyClassName="p-2 md:p-3"
        >
          <div className="mx-auto max-w-full" style={BOARD_SIZE_STYLE}>
            {barFor(topColor, 'top')}
            <div className="relative">
              <ChessBoard
                fen={displayFen}
                orientation={orientation}
                selectedSquare={selectedSquare}
                legalTargets={legalTargets}
                lastMoveSquares={lastMoveSquares}
                checkSquare={checkSquare}
                disabled={!canInteract}
                isDraggableSquare={isOwnTurnPiece}
                onSquareClick={handleSquareClick}
                onSquareDrop={attemptMove}
              />
              {pendingPromotion && playerColor && (
                <ChessPromotionPicker color={playerColor} onSelect={handlePromotion} onCancel={() => setPendingPromotion(null)} />
              )}
              {isReviewing && (
                <button
                  type="button"
                  onClick={() => setViewPly(null)}
                  className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/25 bg-black/62 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgb(0_0_0_/_0.28)] backdrop-blur-md transition hover:bg-black/75"
                >
                  {currentPly}수 국면 보는 중 · 현재로 돌아가기
                </button>
              )}
              {isPending && (
                <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2">
                  <div className="flex items-center gap-2 rounded-full border border-white/25 bg-black/62 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgb(0_0_0_/_0.28)] backdrop-blur-md">
                    <Loader2 className="animate-spin" size={16} />
                    {pendingLabel || '처리 중'}
                  </div>
                </div>
              )}
            </div>
            {barFor(bottomColor, 'bottom')}
          </div>
        </WindowSurface>

        <GameInfoPanel
          game={game}
          isPlayerTurn={isPlayerTurn}
          pending={isPending}
          canUndo={canUndo}
          canResign={canResign}
          rematchPending={rematchMutation.isPending}
          currentPly={currentPly}
          history={history}
          onSelectPly={handleSelectPly}
          onCopyPgn={copyPgn}
          onUndo={handleUndo}
          onResign={handleResign}
          onRematch={(swapColor) => rematchMutation.mutate(swapColor)}
        />
      </section>
    </ChessPageFrame>
  );
}
