/**
 * Canonical Backend API Endpoints Configuration
 *
 * Mapped 1:1 with NestJS backend controllers under `/api/v1`.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  // Authentication & Identity
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    GOOGLE: '/auth/google',
    GITHUB: '/auth/github',
  },

  // Users
  USERS: {
    BASE: '/users',
    ME: '/users/me',
    BY_ID: (id: string) => `/users/${id}`,
  },

  // Workspaces
  WORKSPACES: {
    BASE: '/workspaces',
    BY_ID: (id: string) => `/workspaces/${id}`,
    BY_SLUG: (slug: string) => `/workspaces/slug/${slug}`,
    MEMBERS: (id: string) => `/workspaces/${id}/members`,
    MEMBER_BY_ID: (id: string, userId: string) => `/workspaces/${id}/members/${userId}`,
    SETTINGS: (id: string) => `/workspaces/${id}/settings`,
  },

  // GitHub Integration & Repositories
  GITHUB: {
    CONNECT: '/github/connect',
    CALLBACK: '/github/callback',
    ACCOUNTS: '/github/accounts',
    ACCOUNT_BY_ID: (id: string) => `/github/accounts/${id}`,
  },

  REPOSITORIES: {
    BASE: (workspaceId: string) => `/workspaces/${workspaceId}/repositories`,
    BY_ID: (workspaceId: string, repoId: string) =>
      `/workspaces/${workspaceId}/repositories/${repoId}`,
    SYNC: (workspaceId: string, repoId: string) =>
      `/workspaces/${workspaceId}/repositories/${repoId}/sync`,
    BRANCHES: (workspaceId: string, repoId: string) =>
      `/workspaces/${workspaceId}/repositories/${repoId}/branches`,
    COMMITS: (workspaceId: string, repoId: string) =>
      `/workspaces/${workspaceId}/repositories/${repoId}/commits`,
    PULL_REQUESTS: (workspaceId: string, repoId: string) =>
      `/workspaces/${workspaceId}/repositories/${repoId}/prs`,
    ISSUES: (workspaceId: string, repoId: string) =>
      `/workspaces/${workspaceId}/repositories/${repoId}/issues`,
  },

  // Knowledge, Documents & Uploads
  KNOWLEDGE: {
    SOURCES: (workspaceId: string) => `/workspaces/${workspaceId}/knowledge/sources`,
    CHUNKS: (workspaceId: string) => `/workspaces/${workspaceId}/knowledge/chunks`,
  },

  DOCUMENTS: {
    BASE: (workspaceId: string) => `/workspaces/${workspaceId}/documents`,
    BY_ID: (workspaceId: string, id: string) => `/workspaces/${workspaceId}/documents/${id}`,
  },

  UPLOADS: {
    BASE: '/uploads',
    DOCUMENT: (workspaceId: string) => `/workspaces/${workspaceId}/uploads/document`,
    AVATAR: '/uploads/avatar',
  },

  // Hybrid Search Engine
  SEARCH: {
    BASE: '/search',
    HISTORY: '/search/history',
    SAVED: '/search/saved',
  },

  // AI Chat & Conversations (RAG)
  CHAT: {
    SYNC: '/chat',
    STREAM: '/chat/stream',
    CONVERSATIONS: '/chat/conversations',
    CONVERSATION_BY_ID: (id: string) => `/chat/conversations/${id}`,
    MESSAGES: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    PIN: (conversationId: string) => `/chat/conversations/${conversationId}/pin`,
  },

  // Analytics & Insights (8 domains)
  ANALYTICS: {
    AGGREGATE: (workspaceId: string) => `/workspaces/${workspaceId}/analytics/aggregate`,
    REPOSITORY: (workspaceId: string) => `/workspaces/${workspaceId}/analytics/repository`,
    AI: (workspaceId: string) => `/workspaces/${workspaceId}/analytics/ai`,
    SEARCH: (workspaceId: string) => `/workspaces/${workspaceId}/analytics/search`,
    KNOWLEDGE: (workspaceId: string) => `/workspaces/${workspaceId}/analytics/knowledge`,
    CONVERSATION: (workspaceId: string) => `/workspaces/${workspaceId}/analytics/conversation`,
    JOB: (workspaceId: string) => `/workspaces/${workspaceId}/analytics/job`,
    RAG: (workspaceId: string) => `/workspaces/${workspaceId}/analytics/rag`,
    WORKSPACE: (workspaceId: string) => `/workspaces/${workspaceId}/analytics/workspace`,
  },

  // Notifications & Timeline
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    PREFERENCES: '/notifications/preferences',
  },

  TIMELINE: {
    EVENTS: (workspaceId: string) => `/workspaces/${workspaceId}/timeline`,
  },

  // System & Health
  HEALTH: {
    BASE: '/health',
    READY: '/ready',
    LIVE: '/live',
  },

  // Administration (UserRole.ADMIN)
  ADMIN: {
    OVERVIEW: '/admin',
    USERS: '/admin/users',
    QUEUES: '/admin/queues',
    METRICS: '/admin/metrics',
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
