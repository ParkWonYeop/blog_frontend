import { http } from '@/shared/api/http';
import type {
  ApiResponse,
  ChessGameCreateRequest,
  ChessGamePageResponse,
  ChessGamePgnResponse,
  ChessGameResponse,
  ChessGameStatsResponse,
  ChessMoveRequest,
  ChessPuzzle,
  OnlineGamePageResponse,
  OnlineGameResponse,
} from '@/shared/types';

const requireApiData = <T>(response: ApiResponse<T>, fallbackMessage: string) => {
  if (!response.data) {
    throw new Error(response.message || fallbackMessage);
  }

  return response.data;
};

export const getTodayChessPuzzle = async (timezone = 'Asia/Seoul') => {
  const response = await http.get<ApiResponse<ChessPuzzle>>('/api/chess-puzzles/today', {
    params: { timezone },
  });

  return response.data.data;
};

export const createChessGame = async (data: ChessGameCreateRequest) => {
  const response = await http.post<ApiResponse<ChessGameResponse>>('/api/chess/games', data);

  return requireApiData(response.data, '대국을 생성하지 못했습니다.');
};

export const getChessGames = async ({
  page = 0,
  size = 20,
  sort = 'updatedAt,desc',
}: {
  page?: number;
  size?: number;
  sort?: string;
} = {}) => {
  const response = await http.get<ApiResponse<ChessGamePageResponse>>('/api/chess/games', {
    params: { page, size, sort },
  });

  return requireApiData(response.data, '대국 기록을 불러오지 못했습니다.');
};

export const getChessGameStats = async () => {
  const response = await http.get<ApiResponse<ChessGameStatsResponse>>('/api/chess/games/stats');

  return requireApiData(response.data, '대국 통계를 불러오지 못했습니다.');
};

export const getChessGame = async (gameId: string) => {
  const response = await http.get<ApiResponse<ChessGameResponse>>(`/api/chess/games/${gameId}`);

  return requireApiData(response.data, '대국 상세를 불러오지 못했습니다.');
};

export const getChessGamePgn = async (gameId: string) => {
  const response = await http.get<ApiResponse<ChessGamePgnResponse>>(`/api/chess/games/${gameId}/pgn`);

  return requireApiData(response.data, 'PGN을 불러오지 못했습니다.');
};

export const postChessMove = async (gameId: string, data: ChessMoveRequest) => {
  const response = await http.post<ApiResponse<ChessGameResponse>>(`/api/chess/games/${gameId}/moves`, data);

  return requireApiData(response.data, '착수를 처리하지 못했습니다.');
};

export const resignChessGame = async (gameId: string) => {
  const response = await http.post<ApiResponse<ChessGameResponse>>(`/api/chess/games/${gameId}/resign`);

  return requireApiData(response.data, '기권을 처리하지 못했습니다.');
};

export const undoChessMove = async (gameId: string) => {
  const response = await http.post<ApiResponse<ChessGameResponse>>(`/api/chess/games/${gameId}/undo`);

  return requireApiData(response.data, '무르기를 처리하지 못했습니다.');
};

export const getOnlineGame = async (gameId: string) => {
  const response = await http.get<ApiResponse<OnlineGameResponse>>(`/api/chess/online/games/${gameId}`);

  return requireApiData(response.data, '대국을 불러오지 못했습니다.');
};

/** 진행 중인 온라인 대국. 없으면 null. */
export const getActiveOnlineGame = async () => {
  const response = await http.get<ApiResponse<OnlineGameResponse | null>>('/api/chess/online/games/active');

  return response.data.data ?? null;
};

export const getOnlineGames = async ({ page = 0, size = 20 }: { page?: number; size?: number } = {}) => {
  const response = await http.get<ApiResponse<OnlineGamePageResponse>>('/api/chess/online/games', {
    params: { page, size },
  });

  return requireApiData(response.data, '온라인 대국 기록을 불러오지 못했습니다.');
};
