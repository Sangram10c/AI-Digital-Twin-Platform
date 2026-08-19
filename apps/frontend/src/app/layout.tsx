import type { Metadata } from 'next';
import '@/app/globals.css';
import { AppProviders } from '@/components/providers';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'AI Digital Twin Platform',
    template: '%s | AI Digital Twin',
  },
  description:
    'Enterprise AI Engineering Intelligence Platform — turn Git history, commits, pull requests, and documentation into grounded AI insights.',
  keywords: [
    'AI',
    'Engineering Intelligence',
    'RAG',
    'Developer Tools',
    'GitHub',
    'Git',
    'Software Development',
  ],
  authors: [{ name: 'AI Digital Twin Team' }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/apple-icon.png' }, { url: '/logo.png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'AI Digital Twin Platform',
    title: 'AI Digital Twin Platform',
    description: 'Enterprise AI Engineering Intelligence Platform',
    images: [
      {
        url: '/logo.png',
        width: 1024,
        height: 1024,
        alt: 'AI Digital Twin Platform Logo',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
