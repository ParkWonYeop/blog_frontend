'use client';

import { useChessPreferences } from '@/features/chess/preferences';

export type ChessFeedback = 'move' | 'check' | 'lowTime';
let audioContext: AudioContext | null = null;

/** Must be called from a user gesture so mobile browsers can unlock audio. */
export async function unlockChessAudio() {
  if (typeof window === 'undefined' || !window.AudioContext) return false;
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') await audioContext.resume();
    return audioContext.state === 'running';
  } catch {
    return false;
  }
}

export function suspendChessAudio() {
  if (audioContext?.state === 'running') void audioContext.suspend().catch(() => {});
}

const tones: Record<ChessFeedback, readonly number[]> = {
  move: [520],
  check: [660, 880],
  lowTime: [880, 660, 880],
};
const pulses: Record<ChessFeedback, number | number[]> = {
  move: 15,
  check: [35, 60, 35],
  lowTime: [50, 70, 50],
};

export function playChessFeedback(kind: ChessFeedback) {
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') return;
  const { sound, vibration } = useChessPreferences.getState();
  if (sound && audioContext?.state === 'running') {
    const context = audioContext;
    tones[kind].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * 0.12;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.1);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }
  if (vibration && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pulses[kind]);
  }
}
