/**
 * User Service
 *
 * Handles user-related API calls.
 */
import { api } from './api.service';
import type { User } from '@/types/user.types';

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data } = await api.get<User[]>('/users');
    return data;
  },

  async getUserById(id: string): Promise<User> {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  async updateUser(id: string, payload: Partial<User>): Promise<User> {
    const { data } = await api.patch<User>(`/users/${id}`, payload);
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
