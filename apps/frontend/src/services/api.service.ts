/**
 * API Service
 *
 * Centralized Axios instance with interceptors for:
 * - Base URL configuration (from canonical api.config)
 * - JWT token injection
 * - Automatic envelope unwrapping for backend { statusCode, data } responses
 * - Response error handling & session synchronization
 */
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/config/api.config';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - automatically unwrap backend { statusCode, message, data } envelope
api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data &&
      'statusCode' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    // Handle 401 - clear session
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
