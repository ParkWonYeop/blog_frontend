import type { CSSProperties } from 'react';

export type DockToneStyle = CSSProperties & {
  '--dock-item-bg': string;
  '--dock-item-bg-hover': string;
  '--dock-item-bg-active': string;
  '--dock-item-border': string;
  '--dock-item-border-hover': string;
  '--dock-item-fg': string;
  '--dock-item-fg-strong': string;
  '--dock-item-ring': string;
};

const createDockTone = (
  bg: string,
  hover: string,
  active: string,
  border: string,
  borderHover: string,
  fg: string,
  fgStrong: string,
  ring: string,
): DockToneStyle => ({
  '--dock-item-bg': bg,
  '--dock-item-bg-hover': hover,
  '--dock-item-bg-active': active,
  '--dock-item-border': border,
  '--dock-item-border-hover': borderHover,
  '--dock-item-fg': fg,
  '--dock-item-fg-strong': fgStrong,
  '--dock-item-ring': ring,
});

const defaultTone = createDockTone(
  'rgba(255, 255, 255, 0.24)',
  'rgba(255, 255, 255, 0.36)',
  'rgba(255, 255, 255, 0.46)',
  'rgba(255, 255, 255, 0.2)',
  'rgba(255, 255, 255, 0.34)',
  'var(--color-text-muted)',
  'var(--color-text)',
  'rgba(255, 255, 255, 0.34)',
);

const dockToneStyles: Record<string, DockToneStyle> = {
  home: createDockTone('rgba(255, 255, 255, 0.58)', 'rgba(255, 255, 255, 0.68)', 'rgba(255, 255, 255, 0.76)', 'rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.46)', 'var(--color-text-muted)', 'var(--color-text)', 'rgba(255, 255, 255, 0.42)'),
  archive: createDockTone('rgba(222, 216, 255, 0.54)', 'rgba(222, 216, 255, 0.64)', 'rgba(222, 216, 255, 0.72)', 'rgba(255, 255, 255, 0.26)', 'rgba(151, 132, 214, 0.34)', '#6f668f', '#514274', 'rgba(151, 132, 214, 0.2)'),
  chess: createDockTone('rgba(255, 229, 162, 0.54)', 'rgba(255, 229, 162, 0.64)', 'rgba(255, 229, 162, 0.72)', 'rgba(255, 255, 255, 0.28)', 'rgba(184, 134, 42, 0.34)', '#7b6d4a', '#665125', 'rgba(184, 134, 42, 0.2)'),
  admin: createDockTone('rgba(192, 226, 255, 0.54)', 'rgba(192, 226, 255, 0.64)', 'rgba(192, 226, 255, 0.72)', 'rgba(255, 255, 255, 0.27)', 'rgba(81, 145, 195, 0.34)', '#627f96', '#3f6686', 'rgba(81, 145, 195, 0.2)'),
  write: createDockTone('rgba(255, 209, 184, 0.54)', 'rgba(255, 209, 184, 0.64)', 'rgba(255, 209, 184, 0.72)', 'rgba(255, 255, 255, 0.28)', 'rgba(187, 106, 70, 0.34)', '#8c705f', '#724d38', 'rgba(187, 106, 70, 0.2)'),
  login: createDockTone('rgba(190, 236, 238, 0.54)', 'rgba(190, 236, 238, 0.64)', 'rgba(190, 236, 238, 0.72)', 'rgba(255, 255, 255, 0.27)', 'rgba(68, 150, 158, 0.34)', '#63898c', '#446d72', 'rgba(68, 150, 158, 0.2)'),
  signup: createDockTone('rgba(237, 207, 250, 0.54)', 'rgba(237, 207, 250, 0.64)', 'rgba(237, 207, 250, 0.72)', 'rgba(255, 255, 255, 0.27)', 'rgba(153, 91, 176, 0.34)', '#846c8e', '#684a78', 'rgba(153, 91, 176, 0.2)'),
  logout: createDockTone('rgba(255, 207, 216, 0.54)', 'rgba(255, 207, 216, 0.64)', 'rgba(255, 207, 216, 0.72)', 'rgba(255, 255, 255, 0.28)', 'rgba(188, 84, 99, 0.34)', '#8f6970', '#714850', 'rgba(188, 84, 99, 0.2)'),
  pin: createDockTone('rgba(255, 219, 170, 0.56)', 'rgba(255, 219, 170, 0.66)', 'rgba(255, 219, 170, 0.74)', 'rgba(255, 255, 255, 0.28)', 'rgba(184, 118, 44, 0.36)', '#8a704e', '#6b4f2d', 'rgba(184, 118, 44, 0.22)'),
  menu: createDockTone('rgba(213, 234, 203, 0.54)', 'rgba(213, 234, 203, 0.64)', 'rgba(213, 234, 203, 0.72)', 'rgba(255, 255, 255, 0.27)', 'rgba(98, 143, 80, 0.34)', '#6f8366', '#526f44', 'rgba(98, 143, 80, 0.2)'),
  more: createDockTone('rgba(210, 228, 255, 0.54)', 'rgba(210, 228, 255, 0.64)', 'rgba(210, 228, 255, 0.72)', 'rgba(255, 255, 255, 0.27)', 'rgba(86, 126, 183, 0.34)', '#6d7f98', '#4f688d', 'rgba(86, 126, 183, 0.2)'),
  default: defaultTone,
};

export const getDockToneStyle = (key: string) => dockToneStyles[key] ?? dockToneStyles.default;
