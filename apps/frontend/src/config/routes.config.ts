/**
 * Canonical Application Route Definitions
 *
 * Single source of truth for all client-side navigation and route paths.
 */

export const ROUTES = {
  // Public Marketing Routes
  PUBLIC: {
    HOME: '/',
    FEATURES: '/features',
    PRICING: '/pricing',
    DOCS: '/docs',
  },

  // Isolated Authentication Routes
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    CALLBACK: '/callback',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },

  // Authenticated Application (Workspace-Scoped)
  APP: {
    WORKSPACES: '/workspaces',
    WORKSPACE: (slug: string) => `/${slug}`,
    DASHBOARD: (slug: string) => `/${slug}/dashboard`,
    CHAT: (slug: string) => `/${slug}/chat`,
    CHAT_CONVERSATION: (slug: string, id: string) => `/${slug}/chat/${id}`,
    SEARCH: (slug: string) => `/${slug}/search`,
    REPOSITORIES: (slug: string) => `/${slug}/repositories`,
    REPOSITORY_DETAIL: (slug: string, repoId: string) => `/${slug}/repositories/${repoId}`,
    KNOWLEDGE: (slug: string) => `/${slug}/knowledge`,
    ANALYTICS: (slug: string) => `/${slug}/analytics`,
    TIMELINE: (slug: string) => `/${slug}/timeline`,
    SETTINGS: (slug: string) => `/${slug}/settings`,
    MEMBERS: (slug: string) => `/${slug}/settings/members`,
    INTEGRATIONS: (slug: string) => `/${slug}/settings/integrations`,
  },

  // Platform Administration (UserRole.ADMIN)
  ADMIN: {
    OVERVIEW: '/admin',
    USERS: '/admin/users',
    WORKSPACES: '/admin/workspaces',
    QUEUES: '/admin/queues',
    METRICS: '/admin/metrics',
  },
} as const;

export type AppRoutes = typeof ROUTES;
