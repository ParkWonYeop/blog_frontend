import type { Color, PieceSymbol } from 'chess.js';
import { clsx } from 'clsx';

export interface ChessPieceProps {
  color: Color;
  type: PieceSymbol;
  className?: string;
  decorative?: boolean;
}

const PIECE_NAMES: Record<PieceSymbol, string> = {
  k: '킹', q: '퀸', r: '룩', b: '비숍', n: '나이트', p: '폰',
};

// Original vector silhouettes keep pieces identical across system fonts and screens.
// Fixed ivory/charcoal colors preserve white/black identity in either UI theme.
export default function ChessPiece({ color, type, className, decorative = true }: ChessPieceProps) {
  const fill = color === 'w' ? '#fffaf0' : '#202b35';
  const outline = color === 'w' ? '#26323c' : '#f2eee4';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width="64"
      height="64"
      className={clsx('block shrink-0', className)}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : `${color === 'w' ? '백' : '흑'} ${PIECE_NAMES[type]}`}
      focusable="false"
      fill={fill}
      stroke={outline}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {type === 'p' && (
        <>
          <path d="M25 29h14c-4 9-3 16 4 22H21c7-6 8-13 4-22Z" />
          <circle cx="32" cy="20" r="10" />
          <path d="M24 31h16" fill="none" />
        </>
      )}
      {type === 'r' && (
        <>
          <path d="M14 12h8v7h6v-7h8v7h6v-7h8v17l-8 6 2 16H20l2-16-8-6Z" />
          <path d="M14 28h36M22 35h20M21 46h22" fill="none" />
        </>
      )}
      {type === 'n' && (
        <>
          <path d="m23 15 2-9 10 8c13 3 17 17 13 27l-3 10H19l4-11 10-10-9 5-11-5 3-10Z" />
          <path d="M36 20c6 5 9 13 6 22M23 39l9 1" fill="none" />
          <circle cx="26" cy="22" r="1.8" fill={outline} stroke="none" />
          <path d="m15 29 5-3" fill="none" />
        </>
      )}
      {type === 'b' && (
        <>
          <path d="M27 31h10c-2 8-1 14 6 20H21c7-6 8-12 6-20Z" />
          <path d="M32 9c-5 6-13 10-13 17 0 6 6 10 13 10s13-4 13-10c0-7-8-11-13-17Z" />
          <path d="m35 16-8 11M23 40h18" fill="none" />
          <circle cx="32" cy="8" r="3" />
        </>
      )}
      {type === 'q' && (
        <>
          <path d="M24 32h16c-3 7-2 12 4 19H20c6-7 7-12 4-19Z" />
          <path d="m16 17 9 7 7-14 7 14 9-7-6 18H22Z" />
          <circle cx="16" cy="15" r="3.5" />
          <circle cx="32" cy="8" r="3.5" />
          <circle cx="48" cy="15" r="3.5" />
          <path d="M22 35h20M23 42h18" fill="none" />
        </>
      )}
      {type === 'k' && (
        <>
          <path d="M26 31h12c-2 8-1 14 6 20H20c7-6 8-12 6-20Z" />
          <path d="M28 5h8v7h6v7h-6v8h-8v-8h-6v-7h6Z" />
          <path d="M18 29c0-7 8-9 14-3 6-6 14-4 14 3 0 4-3 8-6 10H24c-3-2-6-6-6-10Z" />
          <path d="M24 40h16M23 45h18" fill="none" />
        </>
      )}
      <path d="M19 51h26l4 7H15Z" />
      <path d="M19 51h26" fill="none" />
    </svg>
  );
}
