import axios from 'axios';
import type { CSSProperties } from 'react';
import { formatKoreanReadableDate } from '@/shared/lib/dates';
import { getErrorMessage } from '@/shared/lib/errors';
import type { ChessOutcome } from '@/shared/types';

/** 보드 폭: 화면 폭을 넘지 않는 선에서 최대 40rem, 세로가 짧은 화면에서만 높이에 맞춰 줄인다. */
export const BOARD_SIZE_STYLE: CSSProperties = {
  width: 'min(100%, clamp(19rem, calc(100svh - 12rem), 40rem))',
};

export type OutcomeFilter = 'ALL' | 'IN_PROGRESS' | 'WIN' | 'LOSS' | 'DRAW';

export const outcomeLabels: Record<ChessOutcome, string> = {
  IN_PROGRESS: '진행중',
  WIN: '승',
  LOSS: '패',
  DRAW: '무',
  UNKNOWN: '미정',
};

export const outcomeBadgeTones: Record<ChessOutcome, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  IN_PROGRESS: 'info',
  WIN: 'success',
  LOSS: 'danger',
  DRAW: 'warning',
  UNKNOWN: 'neutral',
};

export const getChessOutcomeLabel = (outcome: ChessOutcome, status?: string) => {
  if (status === 'RESIGNED' && outcome === 'LOSS') return '기권패';

  return outcomeLabels[outcome];
};

export const formatChessDateTime = (value?: string) => {
  return formatKoreanReadableDate(value, true, value ?? '');
};

export const getChessErrorMessage = (error: unknown, fallback = '요청을 처리하지 못했습니다.') => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return '로그인이 필요합니다.';
    }

  }

  return getErrorMessage(error, fallback);
};

export const isAuthError = (error: unknown) => {
  return axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403);
};
