'use client';

import { useState, useSyncExternalStore } from 'react';
import { Focus, Volume2, VolumeX, Vibrate } from 'lucide-react';
import { clsx } from 'clsx';
import { usePageFocus } from '@/shared/layout/PageFocusContext';
import { useChessPreferences, useHydrateChessPreferences } from '@/features/chess/preferences';
import { playChessFeedback, unlockChessAudio } from '@/features/chess/feedback';

const subscribe = () => () => {};
const supportsVibration = () => typeof navigator.vibrate === 'function';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-xs font-semibold transition hover:bg-[var(--card-bg-strong)] disabled:opacity-50';

export default function ChessPlayToolbar() {
  const { isFocused, setFocused } = usePageFocus();
  const { sound, vibration, setSound, setVibration } = useChessPreferences();
  const canVibrate = useSyncExternalStore(subscribe, supportsVibration, () => false);
  const [notice, setNotice] = useState('');
  useHydrateChessPreferences();

  const toggleSound = async () => {
    if (sound) { setSound(false); setNotice(''); return; }
    if (!await unlockChessAudio()) {
      setNotice('이 브라우저에서는 소리를 재생할 수 없습니다.');
      return;
    }
    setSound(true);
    setNotice('');
    playChessFeedback('move');
  };

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2" role="group" aria-label="대국 화면 및 알림 설정">
        {!isFocused && (
          <button type="button" onClick={() => setFocused(true)} aria-pressed={false} className={`${buttonClass} text-[var(--color-text-muted)]`}>
            <Focus size={16} /> 집중 모드
          </button>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => void toggleSound()} aria-pressed={sound} aria-label="대국 소리" className={clsx(buttonClass, sound ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]')}>
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />} 소리
          </button>
          <button type="button" disabled={!canVibrate} title={canVibrate ? '착수·체크·시간 부족 진동' : '이 브라우저는 진동을 지원하지 않습니다.'} onClick={() => { setVibration(!vibration); if (!vibration) playChessFeedback('move'); }} aria-pressed={canVibrate && vibration} aria-label="대국 진동" className={clsx(buttonClass, canVibrate && vibration ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]')}>
            <Vibrate size={16} /> {canVibrate ? '진동' : '진동 미지원'}
          </button>
        </div>
      </div>
      {notice && <p role="status" className="mt-2 text-xs text-[var(--color-text-muted)]">{notice}</p>}
    </div>
  );
}
