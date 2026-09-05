import type { Metadata } from 'next';
import ChessHistoryClient from '@/features/chess/components/ChessHistoryClient';

export const metadata: Metadata = {
  title: '대국 기록 | WYPark Blog',
  description: '체스 대국 기록',
};

export default function ChessHistoryPage() {
  return <ChessHistoryClient />;
}
