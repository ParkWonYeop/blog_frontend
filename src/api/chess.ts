import { http } from './http';
import { ApiResponse, ChessPuzzle } from '@/types';

export const getTodayChessPuzzle = async (timezone = 'Asia/Seoul') => {
  const response = await http.get<ApiResponse<ChessPuzzle>>('/api/chess-puzzles/today', {
    params: { timezone },
  });

  return response.data.data;
};
