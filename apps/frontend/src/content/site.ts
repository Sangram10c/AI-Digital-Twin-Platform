/**
 * Global Site Configuration & Metadata Content
 */

export interface NavItem {
  title: string;
  href: string;
  description?: string;
  badge?: string;
}

export interface SiteContent {
  name: string;
  tagline: string;
  description: string;
  url: string;
  nav: NavItem[];
  footer: {
    copyright: string;
    links: { title: string; href: string }[];
  };
  cta: {
    primary: string;
    secondary: string;
    signIn: string;
    openApp: string;
  };
}

export const siteContent: SiteContent = {
  name: 'AI Digital Twin',
  tagline: 'Your Projects, Understood by AI.',
  description:
    'Connect your software projects, keep your knowledge in one place, and ask questions in plain language with verified answers.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  nav: [
    { title: 'Features', href: '/features', description: 'Explore what your Digital Twin can do' },
    {
      title: 'How It Works',
      href: '/#how-it-works',
      description: 'See how your project knowledge comes together',
    },
    { title: 'Architecture', href: '/architecture', description: 'Technical design and data flow' },
    { title: 'Integrations', href: '/integrations', description: 'Connect GitHub and AI models' },
    { title: 'Security', href: '/security', description: 'How your project data is protected' },
    { title: 'Pricing', href: '/pricing', description: 'Simple, transparent plans' },
    { title: 'Docs', href: '/docs', description: 'Developer guides and documentation' },
  ],
  footer: {
    copyright: `© ${new Date().getFullYear()} AI Digital Twin Platform. All rights reserved.`,
    links: [
      { title: 'Features', href: '/features' },
      { title: 'Architecture', href: '/architecture' },
      { title: 'Integrations', href: '/integrations' },
      { title: 'Security', href: '/security' },
      { title: 'Pricing', href: '/pricing' },
      { title: 'Documentation', href: '/docs' },
    ],
  },
  cta: {
    primary: 'Get Started Free',
    secondary: 'Explore the Platform',
    signIn: 'Sign In',
    openApp: 'Open Workspace',
  },
};
