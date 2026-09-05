import type { PageMeta } from '@/shared/types/api';

export interface ChessPuzzle {
  id: number;
  date: string;
  title: string;
  theme: string;
  fen: string;
  answer: string;
  answerUci: string;
  hint: string;
  rating: number;
  sourceUrl: string;
}

export type ChessOutcome = 'IN_PROGRESS' | 'WIN' | 'LOSS' | 'DRAW' | 'UNKNOWN';
export type ChessColor = 'white' | 'black';
export type MaiaModel = '3m' | '5m' | '23m' | '79m';

export interface ChessGameCreateRequest {
  rating?: number;
  playerColor?: ChessColor;
  model?: MaiaModel;
  temperature?: number;
  topP?: number;
}

export interface ChessGameResponse {
  gameId: string;
  rating: number;
  playerColor: ChessColor;
  model: MaiaModel;
  temperature?: number;
  topP?: number;
  fen: string;
  turn: ChessColor;
  moves: string[];
  status: string;
  result: string | null;
  outcome: ChessOutcome;
  pgn: string;
  maiaMove: string | null;
}

export interface ChessGameSummaryResponse {
  gameId: string;
  rating: number;
  playerColor: ChessColor;
  model: string;
  status: string;
  result: string | null;
  outcome: ChessOutcome;
  movesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChessGameStatsResponse {
  total: number;
  inProgress: number;
  wins: number;
  losses: number;
  draws: number;
  unknown: number;
}

export interface ChessGamePgnResponse {
  gameId: string;
  pgn: string;
}

export interface ChessMoveRequest {
  move: string;
}

export interface ChessGamePageResponse extends PageMeta {
  content: ChessGameSummaryResponse[];
  page?: PageMeta;
  size?: number;
  first?: boolean;
  empty?: boolean;
}
