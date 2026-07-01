import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AI Digital Twin Platform',
    template: '%s | AI Digital Twin',
  },
  description:
    'Enterprise AI Digital Twin Platform - Build, manage, and deploy intelligent digital twins powered by AI.',
  keywords: ['AI', 'Digital Twin', 'Machine Learning', 'Enterprise', 'SaaS'],
  authors: [{ name: 'AI Digital Twin Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'AI Digital Twin Platform',
    title: 'AI Digital Twin Platform',
    description: 'Enterprise AI Digital Twin Platform',
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {/* Providers will wrap children here */}
        {children}
      </body>
    </html>
  );
}
