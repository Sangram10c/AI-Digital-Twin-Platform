/**
 * API Configuration
 */
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  version: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
  timeout: 30000,
} as const;
