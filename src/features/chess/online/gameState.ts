import type { Square } from 'chess.js';
import type { OnlineGameResponse } from '@/features/chess/types';

type Promotion = { from: Square; to: Square };
export type OnlineSnapshot = { game: OnlineGameResponse; receivedAt: number };
export interface OnlineUiState {
  snapshot: OnlineSnapshot | null;
  selectedSquare: Square | null;
  pendingPromotion: Promotion | null;
  viewPly: number | null;
  optimistic: { fen: string; from: Square; to: Square; basePly: number } | null;
}
export const initialOnlineUiState: OnlineUiState = {
  snapshot: null, selectedSquare: null, pendingPromotion: null, viewPly: null, optimistic: null,
};
export type OnlineUiAction =
  | { type: 'receive'; snapshot: OnlineSnapshot; initialGame?: OnlineGameResponse; resync?: boolean }
  | { type: 'select'; square: Square | null }
  | { type: 'promotion'; promotion: Promotion | null }
  | { type: 'review'; ply: number | null }
  | { type: 'move'; move: NonNullable<OnlineUiState['optimistic']> }
  | { type: 'reject' };

export function onlineGameReducer(state: OnlineUiState, action: OnlineUiAction): OnlineUiState {
  switch (action.type) {
    case 'select': return { ...state, selectedSquare: action.square };
    case 'promotion': return { ...state, pendingPromotion: action.promotion };
    case 'review': return { ...state, viewPly: action.ply, selectedSquare: null };
    case 'move': return { ...state, optimistic: action.move, selectedSquare: null, pendingPromotion: null };
    case 'reject': return { ...state, optimistic: null };
    case 'receive': {
      const previous = state.snapshot?.game ?? action.initialGame;
      const game = action.snapshot.game;
      const sameGame = previous?.gameId === game.gameId;
      // An online game has no undo. Never replace it with an older clock or position snapshot.
      if (sameGame && (game.serverTime < previous.serverTime || game.moves.length < previous.moves.length)) return state;
      const positionChanged = !sameGame || previous.fen !== game.fen || previous.moves.length !== game.moves.length;
      const ended = game.status !== 'IN_PROGRESS';
      const reviewStillValid = sameGame && state.viewPly !== null && state.viewPly <= game.moves.length &&
        previous.moves.slice(0, state.viewPly).every((move, index) => game.moves[index] === move);
      const optimisticResolved = action.resync || ended || positionChanged ||
        (state.optimistic && game.moves.length > state.optimistic.basePly);
      return {
        snapshot: action.snapshot,
        selectedSquare: positionChanged || ended ? null : state.selectedSquare,
        pendingPromotion: positionChanged || ended ? null : state.pendingPromotion,
        viewPly: reviewStillValid ? state.viewPly : null,
        optimistic: optimisticResolved ? null : state.optimistic,
      };
    }
  }
}
