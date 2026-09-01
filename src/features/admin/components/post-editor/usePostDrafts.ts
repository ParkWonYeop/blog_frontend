'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DraftPost } from './types';

const DRAFT_STORAGE_KEY = 'temp_drafts';

export const usePostDrafts = () => {
  const [drafts, setDrafts] = useState<DraftPost[]>([]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const savedDrafts = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!savedDrafts) return;

      try {
        setDrafts(JSON.parse(savedDrafts) as DraftPost[]);
      } catch {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const saveDrafts = useCallback((nextDrafts: DraftPost[]) => {
    setDrafts(nextDrafts);
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts));
  }, []);

  const deleteDraft = useCallback((id: number) => {
    setDrafts((currentDrafts) => {
      const nextDrafts = currentDrafts.filter((draft) => draft.id !== id);
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts));
      return nextDrafts;
    });
  }, []);

  return { drafts, saveDrafts, deleteDraft };
};
