import type { Metadata } from 'next';
import ChessOnlineJoinClient from '@/features/chess/components/ChessOnlineJoinClient';

export const metadata: Metadata = {
  title: '초대 | WYPark Blog',
  description: '초대 코드로 온라인 대국에 참가합니다.',
};

type ChessOnlineJoinPageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function ChessOnlineJoinPage({ params }: ChessOnlineJoinPageProps) {
  const { code } = await params;

  return <ChessOnlineJoinClient code={decodeURIComponent(code)} />;
}
