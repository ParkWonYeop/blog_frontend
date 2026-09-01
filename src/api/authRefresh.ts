import axios from 'axios';
import { API_BASE_URL } from '@/config/environment';
import type { ApiResponse, AuthResponse } from '@/types';

/**
 * Refresh requests intentionally bypass the shared client so a rejected refresh
 * cannot recursively enter the response interceptor.
 * The refresh token travels in an httpOnly cookie (withCredentials), not the body.
 */
export const reissueAuth = async () => {
  const response = await axios.post<ApiResponse<AuthResponse>>(
    `${API_BASE_URL}/api/auth/reissue`,
    {},
    { headers: { 'Content-Type': 'application/json' }, withCredentials: true },
  );

  return response.data;
};
