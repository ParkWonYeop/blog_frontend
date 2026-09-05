'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Chess as ChessGame, type Color, type Move, type Square } from 'chess.js';
import { clsx } from 'clsx';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { getTodayChessPuzzle } from '@/features/chess/api';
import ChessBoard, { BOARD_SQUARES, type MoveSquares } from '@/features/chess/components/ChessBoard';
import ChessPageFrame from '@/features/chess/components/ChessPageFrame';
import ChessPromotionPicker from '@/features/chess/components/ChessPromotionPicker';
import { getKingInCheckSquare, pickMoveToSquare, type PromotionPiece } from '@/features/chess/lib';
import { BOARD_SIZE_STYLE } from '@/features/chess/components/chessUi';
import { formatKoreanDate } from '@/shared/lib/dates';
import { queryKeys } from '@/shared/lib/queryKeys';
import WindowSurface from '@/shared/ui/WindowSurface';
import { type ChessPuzzle } from '@/shared/types';

type FeedbackTone = 'neutral' | 'success' | 'error';

const TIMEZONE = 'Asia/Seoul';

const turnLabel = (color: Color) => (color === 'w' ? '백' : '흑');

const getReadyFeedback = (puzzle: ChessPuzzle): { tone: FeedbackTone; message: string } => {
  const game = new ChessGame(puzzle.fen);

  return {
    tone: 'neutral',
    message: `${turnLabel(game.turn())} 차례. 체크메이트를 찾으세요.`,
  };
};

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00+09:00`);
  return formatKoreanDate(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: TIMEZONE,
  }, value);
};

function BoardWindow({ children }: { children: ReactNode }) {
  return (
    <WindowSurface title="Board" showTrafficLights={false} bodyClassName="p-2 md:p-3">
      <div className="relative mx-auto max-w-full" style={BOARD_SIZE_STYLE}>
        {children}
      </div>
    </WindowSurface>
  );
}

function LoadingState() {
  return (
    <ChessPageFrame title="오늘의 퍼즐" backHref="/chess" backLabel="체스">
      <section className="grid min-w-0 items-start justify-center gap-5 lg:grid-cols-[minmax(0,40rem)_20rem]">
        <BoardWindow>
          <div className="grid aspect-square w-full grid-cols-8 overflow-hidden rounded-lg border border-[var(--color-line)]">
            {BOARD_SQUARES.map((square, index) => (
              <div
                key={square}
                className={clsx(
                  'aspect-square animate-pulse',
                  (index + Math.floor(index / 8)) % 2 === 0
                    ? 'bg-[#edf2f5] dark:bg-[#c8d0d6]'
                    : 'bg-[#7fa18b] dark:bg-[#415d52]',
                )}
              />
            ))}
          </div>
        </BoardWindow>
        <WindowSurface title="Puzzle" showTrafficLights={false} as="aside" bodyClassName="flex min-h-72 flex-col items-center justify-center p-5 text-center">
          <Loader2 className="mb-3 animate-spin text-[var(--color-accent)]" size={28} />
          <p className="text-sm font-semibold text-[var(--color-text)]">오늘의 퍼즐을 불러오는 중입니다.</p>
        </WindowSurface>
      </section>
    </ChessPageFrame>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <ChessPageFrame title="오늘의 퍼즐" backHref="/chess" backLabel="체스">
      <WindowSurface title="Puzzle" showTrafficLights={false} bodyClassName="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="mb-3 text-red-500" size={30} />
        <h2 className="break-words text-lg font-bold text-[var(--color-text)]">오늘의 퍼즐을 불러오지 못했습니다.</h2>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
        >
          <RotateCcw size={16} />
          다시 시도
        </button>
      </WindowSurface>
    </ChessPageFrame>
  );
}

function ChessPuzzleBoard({ puzzle }: { puzzle: ChessPuzzle }) {
  const [currentFen, setCurrentFen] = useState(puzzle.fen);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [solved, setSolved] = useState(false);
  const [lastMoveSquares, setLastMoveSquares] = useState<MoveSquares | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [feedback, setFeedback] = useState(getReadyFeedback(puzzle));

  const game = useMemo(() => new ChessGame(currentFen), [currentFen]);
  const checkSquare = useMemo(() => getKingInCheckSquare(game), [game]);
  const legalMoves = useMemo<Move[]>(() => {
    if (!selectedSquare || solved) return [];

    return game.moves({ square: selectedSquare, verbose: true });
  }, [game, selectedSquare, solved]);
  const legalTargets = useMemo(() => new Set(legalMoves.map((move) => move.to)), [legalMoves]);

  const resetPuzzle = () => {
    setCurrentFen(puzzle.fen);
    setSelectedSquare(null);
    setSolved(false);
    setLastMoveSquares(null);
    setPendingPromotion(null);
    setFeedback(getReadyFeedback(puzzle));
  };

  const registerSolvedPuzzle = (move: Move, nextFen: string) => {
    setCurrentFen(nextFen);
    setSolved(true);
    setSelectedSquare(null);
    setLastMoveSquares({ from: move.from, to: move.to });
    setFeedback({
      tone: 'success',
      message: `${move.san} 정답입니다.`,
    });
  };

  const isDraggablePuzzleSquare = (square: Square) => {
    if (solved) return false;

    const piece = game.get(square);

    return piece?.color === game.turn();
  };

  const tryMove = (from: Square, to: Square, promotion?: PromotionPiece) => {
    if (solved || !isDraggablePuzzleSquare(from)) return;

    const movesFromSquare = game.moves({ square: from, verbose: true });
    let candidate: Move | null;
    if (promotion) {
      candidate = movesFromSquare.find((move) => move.to === to && move.promotion === promotion) ?? null;
    } else {
      const picked = pickMoveToSquare(movesFromSquare, to);
      if (picked.needsPromotion) {
        setSelectedSquare(null);
        setPendingPromotion({ from, to });
        return;
      }
      candidate = picked.move;
    }
    setPendingPromotion(null);

    if (!candidate) {
      setFeedback({
        tone: 'error',
        message: '그 칸으로는 이동할 수 없습니다.',
      });
      return;
    }

    try {
      const nextGame = new ChessGame(currentFen);
      const move = nextGame.move({
        from,
        to,
        promotion: candidate.promotion,
      });

      if (nextGame.isCheckmate()) {
        registerSolvedPuzzle(move, nextGame.fen());
        return;
      }

      setSelectedSquare(null);
      setLastMoveSquares(null);
      setFeedback({
        tone: 'error',
        message: `${move.san}은 아직 메이트가 아닙니다.`,
      });
    } catch {
      setFeedback({
        tone: 'error',
        message: '합법적인 수가 아닙니다.',
      });
    }
  };

  const handleSquareClick = (square: Square) => {
    if (solved) return;

    const piece = game.get(square);
    const isTurnPiece = piece?.color === game.turn();

    if (!selectedSquare) {
      if (isTurnPiece) {
        setSelectedSquare(square);
        setFeedback(getReadyFeedback(puzzle));
      }
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (legalTargets.has(square)) {
      tryMove(selectedSquare, square);
      return;
    }

    if (isTurnPiece) {
      setSelectedSquare(square);
      setFeedback(getReadyFeedback(puzzle));
      return;
    }

    setSelectedSquare(null);
  };

  const showHint = () => {
    setFeedback({
      tone: 'neutral',
      message: puzzle.hint,
    });
  };

  return (
    <ChessPageFrame title="오늘의 퍼즐" backHref="/chess" backLabel="체스">

      <section className="grid min-w-0 items-start justify-center gap-5 lg:grid-cols-[minmax(0,40rem)_20rem]">
        <BoardWindow>
          <ChessBoard
            fen={currentFen}
            selectedSquare={selectedSquare}
            legalTargets={legalTargets}
            lastMoveSquares={lastMoveSquares}
            checkSquare={checkSquare}
            disabled={solved || Boolean(pendingPromotion)}
            isDraggableSquare={isDraggablePuzzleSquare}
            onSquareClick={handleSquareClick}
            onSquareDrop={tryMove}
          />
          {pendingPromotion && (
            <ChessPromotionPicker
              color={game.turn()}
              onSelect={(piece) => tryMove(pendingPromotion.from, pendingPromotion.to, piece)}
              onCancel={() => setPendingPromotion(null)}
            />
          )}
        </BoardWindow>

        <WindowSurface title="Puzzle" showTrafficLights={false} as="aside" bodyClassName="p-4 md:p-5">
          <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-[var(--color-text-subtle)]">
                {formatDate(puzzle.date)}
              </p>
              <h2 className="mt-1 break-words text-xl font-bold tracking-normal text-[var(--color-text)]">
                {puzzle.title}
              </h2>
              <p className="mt-1 break-words text-sm text-[var(--color-text-muted)]">{puzzle.theme}</p>
            </div>
            {solved && <CheckCircle2 size={24} className="shrink-0 text-emerald-500" />}
          </div>

          <div
            className={clsx(
              'mb-4 break-words rounded-lg border px-3 py-3 text-sm font-semibold leading-6',
              feedback.tone === 'success' && 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
              feedback.tone === 'error' && 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300',
              feedback.tone === 'neutral' && 'border-[var(--color-line)] bg-black/[0.025] text-[var(--color-text-muted)] dark:bg-white/[0.06]',
            )}
          >
            {feedback.message}
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="min-w-0 rounded-lg bg-black/[0.025] px-3 py-2 dark:bg-white/[0.06]">
              <dt className="text-xs text-[var(--color-text-subtle)]">레이팅</dt>
              <dd className="mt-0.5 truncate font-semibold text-[var(--color-text)]">{puzzle.rating}</dd>
            </div>
            <div className="min-w-0 rounded-lg bg-black/[0.025] px-3 py-2 dark:bg-white/[0.06]">
              <dt className="text-xs text-[var(--color-text-subtle)]">정답</dt>
              <dd className="mt-0.5 truncate font-semibold text-[var(--color-text)]">
                {solved ? puzzle.answer : '숨김'}
              </dd>
            </div>
          </dl>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={resetPuzzle}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-text)]"
              aria-label="다시 시작"
              title="다시 시작"
            >
              <RotateCcw size={18} />
            </button>
            <button
              type="button"
              onClick={showHint}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-text)]"
              aria-label="힌트"
              title="힌트"
            >
              <Lightbulb size={18} />
            </button>
          </div>

          <a
            href={puzzle.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex max-w-full items-center gap-1.5 break-words text-xs font-semibold text-[var(--color-text-subtle)] transition hover:text-[var(--color-accent)]"
          >
            <span className="truncate">Lichess 원문</span>
            <ExternalLink size={13} className="shrink-0" />
          </a>
        </WindowSurface>
      </section>
    </ChessPageFrame>
  );
}

export default function ChessPuzzleClient() {
  const {
    data: puzzle,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.chess.today(TIMEZONE),
    queryFn: () => getTodayChessPuzzle(TIMEZONE),
    retry: 0,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError || !puzzle) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return <ChessPuzzleBoard key={`${puzzle.id}-${puzzle.date}`} puzzle={puzzle} />;
}
