'use client';

import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Chess as ChessGame, type Color, type PieceSymbol, type Square } from 'chess.js';
import { clsx } from 'clsx';
import type { ChessColor } from '@/shared/types';

export type MoveSquares = {
  from: Square;
  to: Square;
};

type BoardPiece = {
  square: Square;
  color: Color;
  type: PieceSymbol;
};

type VisualPiece = BoardPiece & {
  id: string;
};

type BoardDrag = {
  pointerId: number;
  from: Square;
  fen: string;
  orientation: ChessColor;
  startX: number;
  startY: number;
  x: number;
  y: number;
  target: Square | null;
  moved: boolean;
};

interface ChessBoardProps {
  fen: string;
  orientation?: ChessColor;
  selectedSquare?: Square | null;
  legalTargets?: Set<Square>;
  lastMoveSquares?: MoveSquares | null;
  /** 체크 상태인 킹의 칸 */
  checkSquare?: Square | null;
  disabled?: boolean;
  isDraggableSquare?: (square: Square) => boolean;
  onSquareClick?: (square: Square) => void;
  onSquareDrop?: (from: Square, to: Square) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const WHITE_RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;
const BLACK_RANKS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const BOARD_SQUARES = WHITE_RANKS.flatMap((rank) =>
  FILES.map((file) => `${file}${rank}` as Square),
);

export const PIECE_SYMBOLS: Record<Color, Record<PieceSymbol, string>> = {
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

const colorLabel = (color: Color) => (color === 'w' ? '백' : '흑');

const createGame = (fen: string) => {
  try {
    return new ChessGame(fen);
  } catch {
    return new ChessGame();
  }
};

const getBoardSquares = (orientation: ChessColor) => {
  const ranks = orientation === 'black' ? BLACK_RANKS : WHITE_RANKS;
  const files = orientation === 'black' ? [...FILES].reverse() : FILES;

  return ranks.flatMap((rank) => files.map((file) => `${file}${rank}` as Square));
};

const getPieces = (game: ChessGame): BoardPiece[] =>
  BOARD_SQUARES.flatMap((square) => {
    const piece = game.get(square);

    if (!piece) return [];

    return [{ square, color: piece.color, type: piece.type }];
  });

const getSquareLabel = (square: Square, piece?: { color: Color; type: PieceSymbol }) => {
  if (!piece) return `${square} 빈 칸`;

  return `${square} ${colorLabel(piece.color)} ${PIECE_NAMES[piece.type]}`;
};

const isLightSquare = (square: Square) => {
  const fileIndex = FILES.indexOf(square[0] as (typeof FILES)[number]);
  const rank = Number(square[1]);

  return (fileIndex + rank) % 2 === 0;
};

const getSquarePosition = (square: Square, orientation: ChessColor): CSSProperties => {
  const fileIndex = FILES.indexOf(square[0] as (typeof FILES)[number]);
  const rank = Number(square[1]);
  const x = orientation === 'black' ? 7 - fileIndex : fileIndex;
  const y = orientation === 'black' ? rank - 1 : 8 - rank;

  return {
    transform: `translate(${x * 100}%, ${y * 100}%)`,
  };
};

const samePiece = (a: BoardPiece, b: BoardPiece) => a.color === b.color && a.type === b.type;

const canRepresentMove = (fromPiece: VisualPiece, toPiece: BoardPiece) =>
  fromPiece.color === toPiece.color && (fromPiece.type === toPiece.type || fromPiece.type === 'p');

const createPieceId = (piece: BoardPiece, index: number) =>
  `${piece.color}-${piece.type}-${piece.square}-${index}`;

const createVisualPieces = (pieces: BoardPiece[]) => pieces.map((piece, index) => ({ ...piece, id: createPieceId(piece, index) }));

const reconcileVisualPieces = (
  previousPieces: VisualPiece[],
  nextPieces: BoardPiece[],
  lastMoveSquares?: MoveSquares | null,
) => {
  if (!lastMoveSquares) return createVisualPieces(nextPieces);

  const nextBySquare = new Map(nextPieces.map((piece) => [piece.square, piece]));
  const movedPieceTarget = nextBySquare.get(lastMoveSquares.to);

  if (!movedPieceTarget) return createVisualPieces(nextPieces);

  const usedVisualIds = new Set<string>();
  const usedSquares = new Set<Square>();
  const reconciled: VisualPiece[] = [];
  const movingPiece =
    previousPieces.find(
      (piece) => piece.square === lastMoveSquares.from && canRepresentMove(piece, movedPieceTarget),
    ) ?? previousPieces.find((piece) => piece.square === lastMoveSquares.from);

  if (movingPiece) {
    reconciled.push({ ...movingPiece, ...movedPieceTarget });
    usedVisualIds.add(movingPiece.id);
    usedSquares.add(movedPieceTarget.square);
  }

  previousPieces.forEach((visualPiece) => {
    if (usedVisualIds.has(visualPiece.id)) return;

    const nextPiece = nextBySquare.get(visualPiece.square);
    if (!nextPiece || usedSquares.has(nextPiece.square) || !samePiece(visualPiece, nextPiece)) return;

    reconciled.push({ ...visualPiece, ...nextPiece });
    usedVisualIds.add(visualPiece.id);
    usedSquares.add(nextPiece.square);
  });

  nextPieces.forEach((nextPiece, index) => {
    if (usedSquares.has(nextPiece.square)) return;

    reconciled.push({ ...nextPiece, id: createPieceId(nextPiece, previousPieces.length + index) });
  });

  return reconciled;
};

export const getMoveSquares = (move?: string | null): MoveSquares | null => {
  if (!move || move.length < 4) return null;

  return {
    from: move.slice(0, 2) as Square,
    to: move.slice(2, 4) as Square,
  };
};

export const toChessJsColor = (color: ChessColor): Color => (color === 'white' ? 'w' : 'b');

export const getTurnLabel = (color: ChessColor) => (color === 'white' ? '백' : '흑');

export default function ChessBoard({
  fen,
  orientation = 'white',
  selectedSquare,
  legalTargets,
  lastMoveSquares,
  checkSquare,
  disabled = false,
  isDraggableSquare,
  onSquareClick,
  onSquareDrop,
}: ChessBoardProps) {
  const game = useMemo(() => createGame(fen), [fen]);
  const boardSquares = useMemo(() => getBoardSquares(orientation), [orientation]);
  const firstFile = orientation === 'black' ? 'h' : 'a';
  const lastRank = orientation === 'black' ? '8' : '1';
  const [visualState, setVisualState] = useState(() => ({ fen, pieces: createVisualPieces(getPieces(game)) }));
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<BoardDrag | null>(null);
  const suppressClickRef = useRef(false);
  const [drag, setDrag] = useState<BoardDrag | null>(null);
  const activeDrag = !disabled && drag?.fen === fen && drag.orientation === orientation ? drag : null;
  const dragFrom = activeDrag?.from;
  const dragTargets = useMemo(
    () => new Set(dragFrom ? game.moves({ square: dragFrom, verbose: true }).map((move) => move.to) : []),
    [dragFrom, game],
  );
  const highlightedSquare = activeDrag?.from ?? selectedSquare;
  const highlightedTargets = activeDrag ? dragTargets : legalTargets;

  const pointerPosition = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0, target: null };

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    const target = x >= 0 && x < 1 && y >= 0 && y < 1
      ? boardSquares[Math.floor(y * 8) * 8 + Math.floor(x * 8)] ?? null
      : null;

    return { x: x * 100, y: y * 100, target };
  };

  const cancelDrag = () => {
    if (dragRef.current) suppressClickRef.current = true;
    dragRef.current = null;
    setDrag(null);
  };

  const movePointer = (event: PointerEvent<HTMLButtonElement>) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (disabled || current.fen !== fen || current.orientation !== orientation) {
      cancelDrag();
      return;
    }
    const moved = current.moved || Math.hypot(event.clientX - current.startX, event.clientY - current.startY) >= 8;
    if (!moved) return;

    suppressClickRef.current = true;
    const next = { ...current, ...pointerPosition(event.clientX, event.clientY), moved };
    dragRef.current = next;
    setDrag(next);
  };

  const releasePointer = (event: PointerEvent<HTMLButtonElement>) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!current.moved || disabled || current.fen !== fen || current.orientation !== orientation) return;

    const { target } = pointerPosition(event.clientX, event.clientY);
    if (target && game.moves({ square: current.from, verbose: true }).some((move) => move.to === target)) {
      onSquareDrop?.(current.from, target);
    } else if (selectedSquare !== current.from) {
      onSquareClick?.(current.from);
    }
  };

  // FEN과 기물 표시를 함께 갱신한다. updater 안에서 ref를 변경하면 Strict Mode에서 수가 누락될 수 있다.
  if (visualState.fen !== fen) {
    setVisualState({ fen, pieces: reconcileVisualPieces(visualState.pieces, getPieces(game), lastMoveSquares) });
  }

  return (
    <div className="relative aspect-square w-full select-none rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] p-0.5 shadow-[var(--shadow-control)] sm:p-1">
      <div ref={boardRef} role="group" aria-label="체스 보드" className="relative h-full w-full overflow-hidden rounded-md border border-white/60 bg-[var(--color-surface-strong)] [container-type:inline-size] shadow-[0_1px_0_rgb(255_255_255_/_0.46)_inset] dark:border-white/10">
        <div className="grid h-full w-full grid-cols-[repeat(8,minmax(0,1fr))] grid-rows-[repeat(8,minmax(0,1fr))]">
          {boardSquares.map((square) => {
            const piece = game.get(square);
            const isLight = isLightSquare(square);
            const isSelected = highlightedSquare === square;
            const isTarget = highlightedTargets?.has(square) ?? false;
            const isLastMoveSquare = lastMoveSquares?.from === square || lastMoveSquares?.to === square;
            const isCheckSquare = checkSquare === square;
            const canDrag = !disabled && Boolean(onSquareDrop) && Boolean(piece) && (isDraggableSquare?.(square) ?? true);
            const file = square[0];
            const rank = square[1];

            return (
              <button
                key={square}
                type="button"
                onClick={(event) => {
                  if (disabled || (event.detail !== 0 && suppressClickRef.current)) return;
                  onSquareClick?.(square);
                }}
                onPointerDown={(event) => {
                  if (!event.isPrimary || event.button !== 0) return;
                  suppressClickRef.current = false;
                  if (!canDrag) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dragRef.current = {
                    pointerId: event.pointerId, from: square, fen, orientation,
                    startX: event.clientX, startY: event.clientY,
                    ...pointerPosition(event.clientX, event.clientY), moved: false,
                  };
                }}
                onPointerMove={movePointer}
                onPointerUp={releasePointer}
                onPointerCancel={cancelDrag}
                onLostPointerCapture={cancelDrag}
                onContextMenu={(event) => { if (canDrag) event.preventDefault(); }}
                className={clsx(
                  'relative min-h-0 min-w-0 overflow-hidden transition-[filter,box-shadow] duration-150',
                  isLight ? 'bg-[#edf2f5] dark:bg-[#c8d0d6]' : 'bg-[#7fa18b] dark:bg-[#415d52]',
                  canDrag ? 'touch-none cursor-grab active:cursor-grabbing [-webkit-touch-callout:none]' : 'touch-manipulation',
                  !disabled && 'hover:brightness-[1.04] focus-visible:z-20',
                  disabled && 'cursor-not-allowed',
                  activeDrag?.target === square && isTarget && 'brightness-125 ring-4 ring-inset ring-[var(--color-accent)]',
                )}
                aria-label={`${getSquareLabel(square, piece)}${isCheckSquare ? ' 체크' : ''}${isTarget ? ' 이동 가능' : ''}`}
                aria-pressed={isSelected}
                aria-disabled={disabled}
              >
                {isLastMoveSquare && (
                  <span className="absolute inset-1 rounded bg-[var(--color-accent-soft)] shadow-[0_0_0_1px_rgb(255_255_255_/_0.34)_inset]" />
                )}
                {isSelected && (
                  <span className="absolute inset-1 rounded border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-[0_0_0_2px_rgb(255_255_255_/_0.28)_inset]" />
                )}
                {isCheckSquare && (
                  <span className="absolute inset-0 rounded-sm bg-[radial-gradient(circle,rgb(239_68_68_/_0.75)_0%,rgb(239_68_68_/_0.35)_55%,transparent_75%)]" />
                )}
                {file === firstFile && (
                  <span
                    className={clsx(
                      'absolute left-1 top-1 text-[9px] font-bold leading-none sm:left-1.5 sm:top-1.5 sm:text-[10px]',
                      isLight ? 'text-[#7a9a86]' : 'text-white/80',
                    )}
                  >
                    {rank}
                  </span>
                )}
                {rank === lastRank && (
                  <span
                    className={clsx(
                      'absolute bottom-1 right-1 text-[9px] font-bold leading-none sm:bottom-1.5 sm:right-1.5 sm:text-[10px]',
                      isLight ? 'text-[#7a9a86]' : 'text-white/80',
                    )}
                  >
                    {file}
                  </span>
                )}
                {isTarget && (
                  <span
                    className={clsx(
                      'absolute z-10 rounded-full transition',
                      piece
                        ? 'inset-[13%] border-[2px] border-[var(--color-accent)]/70 shadow-[0_0_0_1px_rgb(255_255_255_/_0.28)_inset]'
                        : 'left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 bg-[var(--color-accent)]/42 shadow-[0_1px_3px_rgb(0_0_0_/_0.18)]',
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-0">
          {visualState.pieces.map((piece) => {
            const canDrag = !disabled && (isDraggableSquare?.(piece.square) ?? true);
            const isSelected = highlightedSquare === piece.square;
            const isDragging = activeDrag?.from === piece.square;
            const isLastMovePiece = lastMoveSquares?.to === piece.square;

            return (
              <span
                key={piece.id}
                className={clsx(
                  'absolute left-0 top-0 flex h-[12.5%] w-[12.5%] items-center justify-center',
                  isDragging ? 'z-30' : 'transition-transform duration-200 ease-out motion-reduce:transition-none',
                )}
                style={isDragging ? { left: `${activeDrag.x}%`, top: `${activeDrag.y}%`, transform: 'translate(-50%, -50%)' } : getSquarePosition(piece.square, orientation)}
                aria-hidden="true"
              >
                <span
                  className={clsx(
                    'flex h-full w-full select-none items-center justify-center font-serif text-[10cqw] font-bold leading-none transition-[transform,filter] duration-200',
                    canDrag && 'cursor-grab active:cursor-grabbing',
                    isSelected && 'scale-110 -translate-y-0.5 brightness-110',
                    isLastMovePiece && 'scale-[1.04]',
                    piece.color === 'w'
                      ? 'text-[#fffdf7] [text-shadow:0_1px_2px_rgb(0_0_0_/_0.48),0_0_1px_rgb(0_0_0_/_0.72),0_5px_9px_rgb(15_23_42_/_0.2)]'
                      : 'text-[#151922] [text-shadow:0_1px_0_rgb(255_255_255_/_0.72),0_0_1px_rgb(255_255_255_/_0.82),0_5px_9px_rgb(15_23_42_/_0.2)]',
                  )}
                >
                  {PIECE_SYMBOLS[piece.color][piece.type]}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
