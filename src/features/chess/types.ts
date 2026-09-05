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

export type TimeControlKey = 'BLITZ_1' | 'BLITZ_3' | 'RAPID_10' | 'RAPID_15_10' | 'RAPID_30_15';

export interface TimeControlResponse {
  key: TimeControlKey;
  label: string;
  initialSeconds: number;
  incrementSeconds: number;
}

export interface OnlinePlayerResponse {
  memberId: number;
  nickname: string;
  connected: boolean;
}

export interface OnlineGameResponse {
  gameId: string;
  timeControl: TimeControlResponse;
  white: OnlinePlayerResponse;
  black: OnlinePlayerResponse;
  moves: string[];
  fen: string;
  turn: ChessColor;
  status: string;
  result: string | null;
  pgn: string;
  whiteMillis: number;
  blackMillis: number;
  clockRunning: boolean;
  drawOfferedBy: ChessColor | null;
  forfeitDeadlineAt: number | null;
  serverTime: number;
  createdAt: number;
  finishedAt: number | null;
}

export interface OnlineGameSummaryResponse {
  gameId: string;
  timeControl: TimeControlResponse;
  white: string;
  black: string;
  myColor: ChessColor;
  opponent: string;
  status: string;
  result: string | null;
  outcome: ChessOutcome;
  movesCount: number;
  startedAt: number;
  finishedAt: number | null;
}

export interface OnlineGamePageResponse extends PageMeta {
  content: OnlineGameSummaryResponse[];
  page?: PageMeta;
}

export type OnlineServerMessage =
  | { type: 'AUTH_OK'; memberId: number; nickname: string }
  | { type: 'ERROR'; message: string; code: string }
  | { type: 'INVITE_CREATED'; code: string; timeControl: TimeControlResponse }
  | { type: 'QUEUE_JOINED'; timeControl: TimeControlResponse }
  | { type: 'MATCH_FOUND'; gameId: string }
  | { type: 'GAME_STATE'; game: OnlineGameResponse }
  | { type: 'QUEUE_LEFT' | 'INVITE_CANCELLED' | 'PONG' };

export type OnlineClientMessage =
  | { type: 'AUTH'; token: string }
  | { type: 'INVITE_CREATE' | 'QUEUE_JOIN'; timeControl: TimeControlKey }
  | { type: 'INVITE_JOIN'; code: string }
  | { type: 'SUBSCRIBE' | 'RESIGN' | 'DRAW_OFFER' | 'DRAW_ACCEPT' | 'DRAW_DECLINE'; gameId: string }
  | { type: 'MOVE'; gameId: string; move: string }
  | { type: 'QUEUE_LEAVE' | 'INVITE_CANCEL' | 'PING' };
