'use client';

import { useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { playChessFeedback, suspendChessAudio, unlockChessAudio } from '@/features/chess/feedback';
import { useChessPreferences, useHydrateChessPreferences } from '@/features/chess/preferences';

/** Observe the live position, never the review board. Initial load/rollback does not make a move sound. */
export function useChessMoveFeedback(fen: string | undefined, ply: number, gameId: string) {
  const previous = useRef<{ gameId: string; fen: string; ply: number } | null>(null);
  const sound = useChessPreferences((state) => state.sound);
  useHydrateChessPreferences();

  useEffect(() => {
    if (!sound) return;
    const unlock = () => { void unlockChessAudio(); };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      suspendChessAudio();
    };
  }, [sound]);

  useEffect(() => {
    if (!fen) return;
    const last = previous.current;
    previous.current = { gameId, fen, ply };
    if (!last || last.gameId !== gameId || last.fen === fen || ply <= last.ply) return;
    try {
      playChessFeedback(new Chess(fen).inCheck() ? 'check' : 'move');
    } catch {
      // Ignore a malformed position; the board/API handles its error state.
    }
  }, [fen, gameId, ply]);
}

export function useChessLowTimeFeedback({ gameId, turnKey, millis, receivedAt, running }: {
  gameId: string;
  turnKey: string;
  millis: number;
  receivedAt: number;
  running: boolean;
}) {
  const warnedTurn = useRef<string | null>(null);
  useEffect(() => {
    if (!running) return;
    const key = `${gameId}:${turnKey}`;
    const checkTime = () => {
      const remaining = millis - Math.max(0, Date.now() - receivedAt);
      if (remaining <= 0 || remaining >= 10_000 || warnedTurn.current === key || document.visibilityState !== 'visible') return;
      const preferences = useChessPreferences.getState();
      if (!preferences.sound && !preferences.vibration) return;
      warnedTurn.current = key;
      playChessFeedback('lowTime');
    };
    checkTime();
    const timer = window.setInterval(checkTime, 250);
    return () => window.clearInterval(timer);
  }, [gameId, turnKey, millis, receivedAt, running]);
}
