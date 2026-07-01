/**
 * API Endpoint Constants
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    GOOGLE: '/auth/google',
    GITHUB: '/auth/github',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },
  WORKSPACES: {
    BASE: '/workspaces',
    BY_ID: (id: string) => `/workspaces/${id}`,
  },
  DOCUMENTS: {
    BASE: '/documents',
    BY_ID: (id: string) => `/documents/${id}`,
  },
  AI: {
    CHAT: '/ai/chat',
    COMPLETE: '/ai/complete',
  },
  HEALTH: '/health',
} as const;
