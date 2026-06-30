/**
 * API Service
 *
 * Centralized Axios instance with interceptors for:
 * - Base URL configuration
 * - JWT token injection
 * - Response error handling
 * - Request/response logging
 */
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 - redirect to login or refresh token
    if (error.response?.status === 401) {
      // Token refresh logic will go here
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
