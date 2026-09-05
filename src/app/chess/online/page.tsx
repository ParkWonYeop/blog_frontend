import type { Metadata } from 'next';
import ChessOnlineLobbyClient from '@/features/chess/components/ChessOnlineLobbyClient';

export const metadata: Metadata = {
  title: 'Online | WYPark Blog',
  description: '다른 사람과 실시간 체스 대국',
};

export default function ChessOnlinePage() {
  return <ChessOnlineLobbyClient />;
}
