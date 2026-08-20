import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware
 * Provides server-side route protection and redirection.
 * Authoritative security remains on backend NestJS JWT/Roles guards.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  const isAuthRoute =
    pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/features') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/docs') ||
    pathname.startsWith('/architecture') ||
    pathname.startsWith('/security') ||
    pathname.startsWith('/integrations') ||
    pathname.startsWith('/callback') ||
    pathname.startsWith('/unauthorized') ||
    pathname.startsWith('/forbidden') ||
    pathname.startsWith('/api/health');

  // If already authenticated and trying to access login/register, redirect to workspaces
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/workspaces', request.url));
  }

  // If unauthenticated and accessing protected application/admin routes, redirect to login
  if (!token && !isAuthRoute && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\..*).*)'],
};
