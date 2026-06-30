/**
 * Navigation Configuration
 */
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  disabled?: boolean;
  children?: NavItem[];
}

export const mainNav: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Workspaces', href: '/workspaces' },
  { title: 'Documents', href: '/documents' },
  { title: 'Knowledge', href: '/knowledge' },
  { title: 'Analytics', href: '/analytics' },
];

export const sidebarNav: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { title: 'Workspaces', href: '/workspaces', icon: 'FolderOpen' },
  { title: 'Documents', href: '/documents', icon: 'FileText' },
  { title: 'AI Assistant', href: '/ai', icon: 'Bot' },
  { title: 'Knowledge Base', href: '/knowledge', icon: 'Brain' },
  { title: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { title: 'Settings', href: '/settings', icon: 'Settings' },
];
