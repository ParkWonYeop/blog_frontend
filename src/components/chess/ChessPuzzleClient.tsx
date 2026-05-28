'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Chess as ChessGame, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import { clsx } from 'clsx';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Loader2,
  RotateCcw,
  Target,
} from 'lucide-react';
import { getTodayChessPuzzle } from '@/api/chess';
import Surface from '@/components/ui/Surface';
import { type ChessPuzzle } from '@/types';

type FeedbackTone = 'neutral' | 'success' | 'error';

const TIMEZONE = 'Asia/Seoul';
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;
const BOARD_SQUARES = RANKS.flatMap((rank) => FILES.map((file) => `${file}${rank}` as Square));

const PIECE_SYMBOLS: Record<Color, Record<PieceSymbol, string>> = {
  w: {
    k: '♔',
    q: '♕',
    r: '♖',
    b: '♗',
    n: '♘',
    p: '♙',
  },
  b: {
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
  },
};

const PIECE_NAMES: Record<PieceSymbol, string> = {
  k: '킹',
  q: '퀸',
  r: '룩',
  b: '비숍',
  n: '나이트',
  p: '폰',
};

const turnLabel = (color: Color) => (color === 'w' ? '백' : '흑');

const getReadyFeedback = (puzzle: ChessPuzzle): { tone: FeedbackTone; message: string } => {
  const game = new ChessGame(puzzle.fen);

  return {
    tone: 'neutral',
    message: `${turnLabel(game.turn())} 차례 · 체크메이트 한 수`,
  };
};

const getSquareLabel = (square: Square, piece?: { color: Color; type: PieceSymbol }) => {
  if (!piece) return `${square} 빈 칸`;

  return `${square} ${turnLabel(piece.color)} ${PIECE_NAMES[piece.type]}`;
};

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00+09:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: TIMEZONE,
  }).format(date);
};

function PageHeader() {
  return (
    <section className="flex flex-col gap-2 border-b border-[var(--color-line)] pb-6">
      <div className="flex items-center gap-2 text-[var(--color-accent)]">
        <Target size={23} />
        <h1 className="text-2xl font-bold tracking-normal text-[var(--color-text)] md:text-3xl">
          오늘의 체스 퍼즐
        </h1>
      </div>
      <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
        매일 하나씩 바뀌는 한 수 메이트 퍼즐입니다.
      </p>
    </section>
  );
}

function LoadingState() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-6 md:px-6">
      <PageHeader />
      <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Surface strong className="p-3 md:p-5">
          <div className="mx-auto grid aspect-square w-full max-w-[min(78vh,680px)] grid-cols-8 overflow-hidden rounded-lg border border-[var(--color-line)]">
            {BOARD_SQUARES.map((square, index) => (
              <div
                key={square}
                className={clsx(
                  'aspect-square animate-pulse',
                  (index + Math.floor(index / 8)) % 2 === 0 ? 'bg-black/[0.06]' : 'bg-black/[0.12]',
                  'dark:bg-white/[0.08]',
                )}
              />
            ))}
          </div>
        </Surface>
        <Surface strong as="aside" className="flex min-h-72 flex-col items-center justify-center p-5 text-center">
          <Loader2 className="mb-3 animate-spin text-[var(--color-accent)]" size={28} />
          <p className="text-sm font-semibold text-[var(--color-text)]">오늘의 퍼즐을 불러오는 중입니다.</p>
        </Surface>
      </section>
    </main>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-6 md:px-6">
      <PageHeader />
      <Surface strong className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="mb-3 text-red-500" size={30} />
        <h2 className="text-lg font-bold text-[var(--color-text)]">오늘의 퍼즐을 불러오지 못했습니다.</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
          백엔드 API가 아직 준비되지 않았거나 잠시 응답하지 않습니다.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
        >
          <RotateCcw size={16} />
          다시 시도
        </button>
      </Surface>
    </main>
  );
}

function ChessPuzzleBoard({ puzzle }: { puzzle: ChessPuzzle }) {
  const [currentFen, setCurrentFen] = useState(puzzle.fen);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [solved, setSolved] = useState(false);
  const [lastMoveSquares, setLastMoveSquares] = useState<{ from: Square; to: Square } | null>(null);
  const [feedback, setFeedback] = useState(getReadyFeedback(puzzle));

  const game = useMemo(() => new ChessGame(currentFen), [currentFen]);
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

  const tryMove = (from: Square, to: Square) => {
    const candidate = legalMoves.find((move) => move.to === to);

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
        message: `${move.san}는 아직 메이트가 아닙니다.`,
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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-6 md:px-6">
      <PageHeader />

      <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Surface strong className="p-3 md:p-5">
          <div className="mx-auto grid aspect-square w-full max-w-[min(78vh,680px)] grid-cols-8 overflow-hidden rounded-lg border border-[var(--color-line)] shadow-[var(--shadow-control)]">
            {BOARD_SQUARES.map((square, index) => {
              const piece = game.get(square);
              const file = square[0];
              const rank = square[1];
              const fileIndex = index % 8;
              const rankIndex = Math.floor(index / 8);
              const isLight = (fileIndex + rankIndex) % 2 === 0;
              const isSelected = selectedSquare === square;
              const isTarget = legalTargets.has(square);
              const isLastMoveSquare = lastMoveSquares?.from === square || lastMoveSquares?.to === square;

              return (
                <button
                  key={square}
                  type="button"
                  onClick={() => handleSquareClick(square)}
                  className={clsx(
                    'relative flex aspect-square items-center justify-center overflow-hidden text-[clamp(1.75rem,8vw,4.8rem)] leading-none transition',
                    isLight ? 'bg-[#eef0e6]' : 'bg-[#5f8d68]',
                    isSelected && 'z-10 ring-4 ring-[var(--color-accent)] ring-inset',
                    isLastMoveSquare && 'bg-[var(--color-accent-soft)]',
                    !solved && 'hover:brightness-105 focus-visible:z-20',
                  )}
                  aria-label={getSquareLabel(square, piece)}
                  aria-pressed={isSelected}
                >
                  {file === 'a' && (
                    <span
                      className={clsx(
                        'absolute left-1.5 top-1 text-[10px] font-bold leading-none',
                        isLight ? 'text-[#5f8d68]' : 'text-[#eef0e6]',
                      )}
                    >
                      {rank}
                    </span>
                  )}
                  {rank === '1' && (
                    <span
                      className={clsx(
                        'absolute bottom-1 right-1.5 text-[10px] font-bold leading-none',
                        isLight ? 'text-[#5f8d68]' : 'text-[#eef0e6]',
                      )}
                    >
                      {file}
                    </span>
                  )}
                  {isTarget && (
                    <span
                      className={clsx(
                        'absolute h-4 w-4 rounded-full',
                        piece ? 'h-full w-full rounded-none ring-4 ring-black/20 ring-inset' : 'bg-black/20',
                      )}
                    />
                  )}
                  {piece && (
                    <span
                      className={clsx(
                        'relative z-10 select-none',
                        piece.color === 'w'
                          ? 'text-[#fbfbfb] [text-shadow:0_1px_2px_rgb(0_0_0_/_0.55)]'
                          : 'text-[#202124] [text-shadow:0_1px_1px_rgb(255_255_255_/_0.22)]',
                      )}
                    >
                      {PIECE_SYMBOLS[piece.color][piece.type]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Surface>

        <Surface strong as="aside" className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--color-text-subtle)]">
                {formatDate(puzzle.date)}
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-normal text-[var(--color-text)]">
                {puzzle.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{puzzle.theme}</p>
            </div>
            {solved && <CheckCircle2 size={24} className="shrink-0 text-emerald-500" />}
          </div>

          <div
            className={clsx(
              'mb-4 rounded-lg border px-3 py-3 text-sm font-semibold leading-6',
              feedback.tone === 'success' && 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
              feedback.tone === 'error' && 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300',
              feedback.tone === 'neutral' && 'border-[var(--color-line)] bg-black/[0.025] text-[var(--color-text-muted)] dark:bg-white/[0.06]',
            )}
          >
            {feedback.message}
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-black/[0.025] px-3 py-2 dark:bg-white/[0.06]">
              <dt className="text-xs text-[var(--color-text-subtle)]">난이도</dt>
              <dd className="mt-0.5 font-semibold text-[var(--color-text)]">{puzzle.rating}</dd>
            </div>
            <div className="rounded-lg bg-black/[0.025] px-3 py-2 dark:bg-white/[0.06]">
              <dt className="text-xs text-[var(--color-text-subtle)]">정답</dt>
              <dd className="mt-0.5 font-semibold text-[var(--color-text)]">
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
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-subtle)] transition hover:text-[var(--color-accent)]"
          >
            Lichess 원문
            <ExternalLink size={13} />
          </a>
        </Surface>
      </section>
    </main>
  );
}

export default function ChessPuzzleClient() {
  const {
    data: puzzle,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['chess-puzzle', 'today', TIMEZONE],
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
