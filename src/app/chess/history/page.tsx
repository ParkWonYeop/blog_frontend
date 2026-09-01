import type { Metadata } from 'next';
import ChessHistoryClient from '@/features/chess/components/ChessHistoryClient';

export const metadata: Metadata = {
  title: '대국 기록 | WYPark Blog',
  description: 'Maia 체스 대국 기록과 결과를 확인합니다.',
};

export default function ChessHistoryPage() {
  return <ChessHistoryClient />;
}
