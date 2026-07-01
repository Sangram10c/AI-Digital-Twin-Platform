/**
 * Auth Service
 *
 * Handles authentication API calls.
 */
import { api } from './api.service';
import type { LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth.types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', credentials);
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async refreshToken(): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/refresh');
    return data;
  },

  async getProfile(): Promise<AuthResponse['user']> {
    const { data } = await api.get('/auth/profile');
    return data;
  },
};
