import type { Metadata } from 'next';
import ChessPuzzleClient from '@/components/chess/ChessPuzzleClient';

export const metadata: Metadata = {
  title: '오늘의 체스 퍼즐 | WYPark Blog',
  description: '오늘의 메이트 체스 퍼즐',
};

export default function ChessPuzzlePage() {
  return <ChessPuzzleClient />;
}
