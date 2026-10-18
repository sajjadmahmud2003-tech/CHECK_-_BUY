import { NextRequest, NextResponse } from 'next/server';
import { isPublicPath } from './lib/auth-routes';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Allow public routes immediately
  if (isPublicPath(pathname)) {
    if (pathname === '/auth' || pathname === '/auth/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 2. Check for active session cookie or authorization header
  const sessionCookie = request.cookies.get('landcheck_session')?.value;
  const authHeader = request.headers.get('authorization');

  // Supabase auth stores tokens in cookies named 'sb-<project-ref>-auth-token' or 'sb-auth-token'
  const hasSupabaseCookie = Array.from(request.cookies.getAll()).some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token') && c.value.trim().length > 0
  );

  const hasSession = Boolean(
    (sessionCookie && sessionCookie.trim().length > 0) ||
    hasSupabaseCookie ||
    (authHeader && authHeader.startsWith('Bearer '))
  );

  // 3. If unauthenticated, redirect to /login with requested target and notice
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    const targetDestination = pathname + (search || '');
    loginUrl.searchParams.set('next', targetDestination);
    loginUrl.searchParams.set('notice', 'auth_required');

    return NextResponse.redirect(loginUrl);
  }

  // 4. Authenticated sessions: rewrite or redirect missing directory routes to their proper index pages
  if (pathname === '/records' || pathname === '/records/') {
    return NextResponse.redirect(new URL('/search', request.url));
  }
  if (pathname === '/reports' || pathname === '/reports/') {
    return NextResponse.redirect(new URL('/verify', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/svg assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
