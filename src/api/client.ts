import axios from 'axios';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/** Matches list responses from Express routes `{ data: T[], pagination }`. */
export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function extractPaginated<T>(
  res: AxiosResponse<{ data: T[]; pagination: ApiPagination }>,
): { data: T[]; pagination: ApiPagination } {
  return {
    data: res.data.data,
    pagination: res.data.pagination,
  };
}

import axiosRetry, { exponentialDelay, isNetworkError } from 'axios-retry';
import { Platform } from 'react-native';
import { SecureStorage } from '@/lib/secureStorage';
import { authEventEmitter } from '@/lib/authEventEmitter';

/* ─── Base URL ──────────────────────────────────────── */

export function getApiBaseURL(): string {
  let url = process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

  // Android emulator cannot reach the host machine through localhost/127.0.0.1.
  if (Platform.OS === 'android') {
    url = url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }

  return url;
}

const baseURL = getApiBaseURL();

/* ─── Instance ──────────────────────────────────────── */

export const apiClient = axios.create({
  baseURL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ─── Request Interceptor ───────────────────────────── */

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

/* ─── Response Interceptor — Silent Token Refresh ───── */

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (newToken: string) => {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retryAfterRefresh?: boolean })
      | undefined;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retryAfterRefresh &&
      originalRequest.url &&
      !String(originalRequest.url).includes('/auth/')
    ) {
      if (isRefreshing) {
        // Queue this request until the in-flight refresh completes
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retryAfterRefresh = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          { refreshToken },
        );

        const newAccessToken: string = data.data?.accessToken ?? data.accessToken;
        const newRefreshToken: string = data.data?.refreshToken ?? data.refreshToken ?? refreshToken;

        await SecureStorage.saveTokens(newAccessToken, newRefreshToken);
        processQueue(newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshQueue = [];
        await SecureStorage.clearAll();
        // Signal auth store to force logout
        authEventEmitter.emit('LOGOUT');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/* ─── Retry Config ──────────────────────────────────── */

axiosRetry(apiClient, {
  retries: 2,
  retryDelay: exponentialDelay,
  retryCondition: (error: AxiosError) => {
    // Always retry network errors
    if (isNetworkError(error)) return true;
    const s = error.response?.status;
    if (!s) return false;
    // Skip all 4xx except 429 (rate limit)
    if (s >= 400 && s < 500 && s !== 429) return false;
    // Retry 5xx and 429
    return true;
  },
});
