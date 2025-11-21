import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { refreshAccessToken } from '@/api/authSession';
import { API_BASE_URL } from '@/config/environment';
import { useAuthStore } from '@/store/authStore';

type RetriableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  headers?: Record<string, string>;
};

const AUTHORIZATION_HEADER = 'Authorization';
const REFRESHABLE_STATUS_CODES = new Set([401, 403]);

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers[AUTHORIZATION_HEADER] = `Bearer ${accessToken}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.response || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetriableRequestConfig;
    if (originalRequest._retry || !REFRESHABLE_STATUS_CODES.has(error.response.status)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await refreshAccessToken();
      originalRequest.headers ??= {};
      originalRequest.headers[AUTHORIZATION_HEADER] = `Bearer ${accessToken}`;
      return http(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
