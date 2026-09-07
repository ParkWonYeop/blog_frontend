'use client';

import { useEffect, useState, type RefObject } from 'react';
import { getReadingProgress } from '@/features/post/lib';

export default function useReadingProgress(bodyRef: RefObject<HTMLElement | null>, contentKey: string) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    let frame = 0;
    const update = () => {
      setProgress(getReadingProgress(body.getBoundingClientRect(), window.innerHeight));
    };
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };
    // Image/font loading and the collapsible TOC can change the body's height or position.
    const observer = new ResizeObserver(schedule);
    observer.observe(body);
    observer.observe(document.documentElement);
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [bodyRef, contentKey]);

  return progress;
}
