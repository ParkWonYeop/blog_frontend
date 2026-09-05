import type { Metadata } from 'next';
import ChessMaiaLobbyClient from '@/features/chess/components/ChessMaiaLobbyClient';

export const metadata: Metadata = {
  title: 'Maia3 | WYPark Blog',
  description: 'Maia3와 체스를 둡니다.',
};

export default function ChessMaia3Page() {
  return <ChessMaiaLobbyClient />;
}
