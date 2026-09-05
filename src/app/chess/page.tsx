import type { Metadata } from 'next';
import ChessHub from '@/features/chess/components/ChessHub';

export const metadata: Metadata = {
  title: '체스 | WYPark Blog',
  description: '봇 대국, 퍼즐, 대국 기록',
};

export default function ChessPage() {
  return <ChessHub />;
}
