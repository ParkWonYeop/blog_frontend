'use client';

import type { Color } from 'chess.js';
import { PIECE_SYMBOLS } from '@/features/chess/components/ChessBoard';
import type { PromotionPiece } from '@/features/chess/lib';

interface ChessPromotionPickerProps {
  color: Color;
  onSelect: (piece: PromotionPiece) => void;
  onCancel: () => void;
}

const OPTIONS: { piece: PromotionPiece; label: string }[] = [
  { piece: 'q', label: '퀸' },
  { piece: 'r', label: '룩' },
  { piece: 'b', label: '비숍' },
  { piece: 'n', label: '나이트' },
];

export default function ChessPromotionPicker({ color, onSelect, onCancel }: ChessPromotionPickerProps) {
  return (
    <div
      role="dialog"
      aria-label="승격 기물 선택"
      className="absolute inset-0 z-40 flex items-center justify-center rounded-lg bg-black/45 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        className="flex flex-col items-center gap-3 rounded-xl border border-white/20 bg-[var(--window-bg)] px-4 py-4 shadow-[var(--shadow-window)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm font-bold text-[var(--color-text)]">승격할 기물을 고르세요</p>
        <div className="flex items-center gap-2">
          {OPTIONS.map(({ piece, label }) => (
            <button
              key={piece}
              type="button"
              autoFocus={piece === 'q'}
              onClick={() => onSelect(piece)}
              aria-label={label}
              title={label}
              className="flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] font-serif text-[2.4rem] leading-none text-[var(--color-text)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              {PIECE_SYMBOLS[color][piece]}
            </button>
          ))}
        </div>
        <button type="button" onClick={onCancel} className="text-xs font-semibold text-[var(--color-text-subtle)] hover:text-[var(--color-text)]">
          취소
        </button>
      </div>
    </div>
  );
}
