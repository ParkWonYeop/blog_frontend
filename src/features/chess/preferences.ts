'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChessPreferences {
  sound: boolean;
  vibration: boolean;
  setSound: (enabled: boolean) => void;
  setVibration: (enabled: boolean) => void;
}

export const useChessPreferences = create<ChessPreferences>()(persist(
  (set) => ({
    sound: false,
    vibration: false,
    setSound: (sound) => set({ sound }),
    setVibration: (vibration) => set({ vibration }),
  }),
  {
    name: 'wyp-chess-preferences',
    skipHydration: true,
    partialize: ({ sound, vibration }) => ({ sound, vibration }),
  },
));

export function useHydrateChessPreferences() {
  useEffect(() => {
    if (!useChessPreferences.persist.hasHydrated()) void useChessPreferences.persist.rehydrate();
  }, []);
}
