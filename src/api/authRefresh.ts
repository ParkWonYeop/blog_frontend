import axios from 'axios';
import { API_BASE_URL } from '@/config/environment';
import type { ApiResponse, AuthResponse } from '@/types';

/**
 * Refresh requests intentionally bypass the shared client so a rejected refresh
 * cannot recursively enter the response interceptor.
 */
export const reissueAuth = async (accessToken: string, refreshToken: string) => {
  const response = await axios.post<ApiResponse<AuthResponse>>(
    `${API_BASE_URL}/api/auth/reissue`,
    { accessToken, refreshToken },
    { headers: { 'Content-Type': 'application/json' }, withCredentials: true },
  );

  return response.data;
};
