import type { Metadata } from 'next';
import ChessEngineList from '@/features/chess/components/ChessEngineList';

export const metadata: Metadata = {
  title: 'BOT | WYPark Blog',
  description: '체스 엔진과 대국합니다.',
};

export default function ChessBotPage() {
  return <ChessEngineList />;
}
