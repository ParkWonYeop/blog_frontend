import type { Metadata } from 'next';
import ChessOnlinePlayClient from '@/features/chess/components/ChessOnlinePlayClient';

export const metadata: Metadata = {
  title: '온라인 대국 | WYPark Blog',
  description: '실시간 체스 대국',
};

type ChessOnlineGamePageProps = {
  params: Promise<{
    gameId: string;
  }>;
};

export default async function ChessOnlineGamePage({ params }: ChessOnlineGamePageProps) {
  const { gameId } = await params;

  return <ChessOnlinePlayClient gameId={gameId} />;
}
