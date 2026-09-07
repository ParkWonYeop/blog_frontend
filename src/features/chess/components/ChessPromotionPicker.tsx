'use client';

import type { Color } from 'chess.js';
import ChessPiece from '@/features/chess/components/ChessPiece';
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
        className="flex w-full max-w-80 flex-col items-center gap-3 rounded-xl border border-white/20 bg-[var(--window-bg)] p-3 shadow-[var(--shadow-window)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm font-bold text-[var(--color-text)]">승격할 기물을 고르세요</p>
        <div className="grid w-full grid-cols-4 gap-2">
          {OPTIONS.map(({ piece, label }) => (
            <button
              key={piece}
              type="button"
              autoFocus={piece === 'q'}
              onClick={() => onSelect(piece)}
              aria-label={label}
              title={label}
              className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] text-[var(--color-text)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <ChessPiece color={color} type={piece} className="h-10 w-10" />
              <span className="text-xs font-semibold">{label}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={onCancel} className="min-h-11 w-full rounded-lg text-sm font-semibold text-[var(--color-text-subtle)] hover:text-[var(--color-text)]">
          취소
        </button>
      </div>
    </div>
  );
}
