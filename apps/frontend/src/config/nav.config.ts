/**
 * Navigation Configuration Schemas
 *
 * Defines structured navigation hierarchies for:
 * 1. Public Marketing Navigation
 * 2. Authenticated Workspace Navigation (with WorkspaceRole checks)
 * 3. Platform Administration Navigation (with UserRole.ADMIN checks)
 */

import { UserRole } from '@/types/user.types';
import { WorkspaceRole } from '@/types/workspace.types';

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string;
  disabled?: boolean;
  external?: boolean;
  requiredUserRole?: UserRole[];
  requiredWorkspaceRole?: WorkspaceRole[];
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// 1. Public Website Navigation
export const publicNav: NavItem[] = [
  { title: 'Home', href: '/' },
  { title: 'Features', href: '/features' },
  { title: 'Architecture', href: '/#architecture' },
  { title: 'Pricing', href: '/pricing' },
  { title: 'Documentation', href: '/docs' },
];

// 2. Workspace Application Sidebar (Categorized by Domain)
export const getWorkspaceNavSections = (slug: string): NavSection[] => [
  {
    title: 'Core',
    items: [
      {
        title: 'Dashboard',
        href: `/${slug}/dashboard`,
        icon: 'LayoutDashboard',
      },
      {
        title: 'Repositories',
        href: `/${slug}/repositories`,
        icon: 'GitFork',
      },
      {
        title: 'Timeline',
        href: `/${slug}/timeline`,
        icon: 'History',
      },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      {
        title: 'AI Chat',
        href: `/${slug}/chat`,
        icon: 'Bot',
        badge: 'RAG',
      },
      {
        title: 'Hybrid Search',
        href: `/${slug}/search`,
        icon: 'Search',
      },
      {
        title: 'Knowledge Base',
        href: `/${slug}/knowledge`,
        icon: 'Brain',
      },
      {
        title: 'Analytics & Insights',
        href: `/${slug}/analytics`,
        icon: 'BarChart3',
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Workspace Settings',
        href: `/${slug}/settings`,
        icon: 'Settings',
        requiredWorkspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN],
      },
      {
        title: 'Members & Roles',
        href: `/${slug}/settings/members`,
        icon: 'Users',
        requiredWorkspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN],
      },
      {
        title: 'Integrations',
        href: `/${slug}/settings/integrations`,
        icon: 'PlugZap',
        requiredWorkspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN],
      },
    ],
  },
];

// 3. Platform Administration Navigation (UserRole.ADMIN only)
export const adminNav: NavItem[] = [
  {
    title: 'Overview',
    href: '/admin',
    icon: 'ShieldAlert',
    requiredUserRole: [UserRole.ADMIN],
  },
  {
    title: 'Users & Tenants',
    href: '/admin/users',
    icon: 'Users',
    requiredUserRole: [UserRole.ADMIN],
  },
  {
    title: 'BullMQ Queues',
    href: '/admin/queues',
    icon: 'Cpu',
    requiredUserRole: [UserRole.ADMIN],
  },
  {
    title: 'Provider Metrics',
    href: '/admin/metrics',
    icon: 'Activity',
    requiredUserRole: [UserRole.ADMIN],
  },
];
