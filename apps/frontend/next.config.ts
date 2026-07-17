import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Enable standalone output for Docker builds
  output: 'standalone',
  // Monorepo: include files outside apps/frontend in the trace
  outputFileTracingRoot: path.join(__dirname, '../..'),

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects placeholder
  async redirects() {
    return [];
  },
};

export default nextConfig;
