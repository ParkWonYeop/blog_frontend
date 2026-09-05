import { Chess as ChessGame, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import type { ChessColor, ChessOutcome, TimeControlKey } from '@/shared/types';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type PromotionPiece = 'q' | 'r' | 'b' | 'n';

export interface HistoryEntry {
  ply: number;
  color: Color;
  san: string;
  uci: string;
  from: Square;
  to: Square;
  fen: string;
}

export const toUciMove = (move: Move) => `${move.from}${move.to}${move.promotion ?? ''}`;

/** UCI 수 목록을 처음부터 재생해 SAN과 각 수 이후 FEN을 만든다. 잘못된 수를 만나면 그 앞까지만 돌려준다. */
export const replayMoves = (moves: string[]): HistoryEntry[] => {
  const game = new ChessGame();
  const entries: HistoryEntry[] = [];

  for (const uci of moves) {
    let move: Move;
    try {
      move = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || undefined });
    } catch {
      break;
    }

    entries.push({
      ply: entries.length + 1,
      color: move.color,
      san: move.san,
      uci,
      from: move.from,
      to: move.to,
      fen: game.fen(),
    });
  }

  return entries;
};

export const getFenAtPly = (history: HistoryEntry[], ply: number) => {
  if (ply <= 0) return START_FEN;

  return history[ply - 1]?.fen ?? START_FEN;
};

export const getKingInCheckSquare = (game: ChessGame | null): Square | null => {
  if (!game || !game.inCheck()) return null;

  return game.findPiece({ type: 'k', color: game.turn() })[0] ?? null;
};

/** 목적지가 같은 후보 수 중에서 승격이 필요하면 null을 돌려 사용자가 기물을 고르게 한다. */
export const pickMoveToSquare = (candidates: Move[], to: Square): { move: Move | null; needsPromotion: boolean } => {
  const matches = candidates.filter((move) => move.to === to);
  const promotions = matches.filter((move) => move.promotion);

  if (promotions.length > 1) return { move: null, needsPromotion: true };

  return { move: matches[0] ?? null, needsPromotion: false };
};

const PIECE_VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const START_COUNTS: Record<PieceSymbol, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
const CAPTURE_ORDER: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p'];

export interface MaterialSummary {
  /** 백이 잡은 흑 기물 */
  capturedByWhite: PieceSymbol[];
  /** 흑이 잡은 백 기물 */
  capturedByBlack: PieceSymbol[];
  /** 양수면 백 우세 */
  whiteAdvantage: number;
}

export const getMaterial = (fen: string): MaterialSummary => {
  const counts: Record<Color, Record<PieceSymbol, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };

  for (const char of fen.split(' ')[0] ?? '') {
    const lower = char.toLowerCase() as PieceSymbol;
    if (lower in PIECE_VALUES) counts[char === lower ? 'b' : 'w'][lower] += 1;
  }

  // ponytail: 승격으로 기물 수가 시작값을 넘으면 0으로 잘라 표시만 맞춘다.
  const missing = (color: Color) =>
    CAPTURE_ORDER.flatMap((piece) => Array<PieceSymbol>(Math.max(0, START_COUNTS[piece] - counts[color][piece])).fill(piece));
  const value = (color: Color) => CAPTURE_ORDER.reduce((sum, piece) => sum + counts[color][piece] * PIECE_VALUES[piece], 0);

  return {
    capturedByWhite: missing('b'),
    capturedByBlack: missing('w'),
    whiteAdvantage: value('w') - value('b'),
  };
};

const TERMINATION_LABELS: Record<string, string> = {
  CHECKMATE: '체크메이트',
  STALEMATE: '스테일메이트',
  INSUFFICIENT_MATERIAL: '기물 부족',
  SEVENTYFIVE_MOVES: '75수 규칙',
  FIVEFOLD_REPETITION: '5회 동형 반복',
  FIFTY_MOVES: '50수 규칙',
  THREEFOLD_REPETITION: '3회 동형 반복',
  RESIGNED: '기권',
  TIMEOUT: '시간 초과',
  ABANDONED: '접속 끊김',
  DRAW_AGREED: '합의 무승부',
  ABORTED: '무효',
};

export const getTerminationLabel = (status: string) => TERMINATION_LABELS[status] ?? status;

export const getGameOverTitle = (outcome: ChessOutcome, status: string) => {
  switch (outcome) {
    case 'WIN':
      return '승리했습니다!';
    case 'LOSS':
      return status === 'RESIGNED' ? '기권했습니다.' : 'Maia가 이겼습니다.';
    case 'DRAW':
      return '무승부입니다.';
    default:
      return '대국이 끝났습니다.';
  }
};

export const TIME_CONTROLS: readonly { key: TimeControlKey; label: string; description: string }[] = [
  { key: 'BLITZ_1', label: '1분', description: '블리츠 1분' },
  { key: 'BLITZ_3', label: '3분', description: '블리츠 3분' },
  { key: 'RAPID_10', label: '10분', description: '래피드 10분' },
  { key: 'RAPID_15_10', label: '15|10', description: '래피드 15분, 한 수마다 10초 추가' },
  { key: 'RAPID_30_15', label: '30|15', description: '래피드 30분, 한 수마다 15초 추가' },
];

export const getOutcomeFor = (result: string | null, color: ChessColor, status: string): ChessOutcome => {
  if (status === 'IN_PROGRESS') return 'IN_PROGRESS';

  switch (result) {
    case '1-0':
      return color === 'white' ? 'WIN' : 'LOSS';
    case '0-1':
      return color === 'black' ? 'WIN' : 'LOSS';
    case '1/2-1/2':
      return 'DRAW';
    default:
      return 'UNKNOWN';
  }
};
