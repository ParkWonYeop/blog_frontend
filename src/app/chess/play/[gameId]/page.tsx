import type { Metadata } from 'next';
import ChessGamePlayClient from '@/features/chess/components/ChessGamePlayClient';

export const metadata: Metadata = {
  title: '대국 | WYPark Blog',
  description: '체스 대국',
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
