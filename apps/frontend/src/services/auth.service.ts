/**
 * Auth Service
 * Connects to NestJS Identity module at /api/v1/auth/*
 */
import { api } from './api.service';
import type {
  LoginCredentials,
  RegisterCredentials,
  ForgotPasswordCredentials,
  ResetPasswordCredentials,
  AuthResponse,
  AuthTokens,
} from '@/types/auth.types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', credentials);
    return data;
  },

  async logout(refreshToken?: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/logout', {
      refreshToken: refreshToken || '',
    });
    return data;
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>('/auth/refresh', { refreshToken });
    return data;
  },

  async forgotPassword(credentials: ForgotPasswordCredentials): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', credentials);
    return data;
  },

  async resetPassword(credentials: ResetPasswordCredentials): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', credentials);
    return data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/verify-email', { token });
    return data;
  },
};
