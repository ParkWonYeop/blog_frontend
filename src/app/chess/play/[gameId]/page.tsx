import type { Metadata } from 'next';
import ChessGamePlayClient from '@/features/chess/components/ChessGamePlayClient';

export const metadata: Metadata = {
  title: 'Maia 대국 | WYPark Blog',
  description: 'Maia 체스 대국을 이어서 진행하고 PGN을 확인합니다.',
};

type ChessGamePageProps = {
  params: Promise<{
    gameId: string;
  }>;
};

export default async function ChessGamePage({ params }: ChessGamePageProps) {
  const { gameId } = await params;

  return <ChessGamePlayClient gameId={gameId} />;
}
