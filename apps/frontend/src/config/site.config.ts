/**
 * Site Configuration
 */
export const siteConfig = {
  name: 'AI Digital Twin Platform',
  description: 'Enterprise AI Digital Twin Platform',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/og-image.png',
  links: {
    github: 'https://github.com/your-org/ai-digital-twin',
    docs: '/docs',
  },
} as const;
