import type { Metadata } from 'next';
import ChessHomeClient from '@/features/chess/components/ChessHomeClient';

export const metadata: Metadata = {
  title: 'Maia 체스 | WYPark Blog',
  description: 'Maia3 봇과 체스를 두고 대국 기록과 PGN을 확인합니다.',
};

export default function ChessPage() {
  return <ChessHomeClient />;
}
