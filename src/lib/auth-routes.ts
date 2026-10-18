/**
 * CHECK_&_BUY — Centralized Route Access Control Specification
 *
 * Defines the public routes accessible without authentication,
 * and helper utilities for both middleware (server-side) and
 * AuthRouteGuard (client-side).
 */

export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/officer/login',
  '/admin/login',
  '/auth/officer-login',
  '/auth/admin-login',
  '/buy-land',
] as const;

/**
 * Checks if a given pathname is an unauthenticated public route
 */
export function isPublicPath(pathname: string): boolean {
  if (!pathname) return true;

  // Normalize path (strip trailing slash except for root '/')
  const cleanPath = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;

  // Direct match with defined public routes
  if (PUBLIC_ROUTES.includes(cleanPath as any)) {
    return true;
  }

  // Public Buy Land property details (/buy-land/[id])
  if (cleanPath.startsWith('/buy-land/')) {
    return true;
  }

  // Public Marketplace GET API
  if (cleanPath === '/api/marketplace/listings' || cleanPath.startsWith('/api/marketplace/listings/')) {
    return true;
  }

  // Next.js internal assets, public static resources, favicon, images and auth APIs
  if (
    cleanPath.startsWith('/_next') ||
    cleanPath.startsWith('/api/auth') ||
    cleanPath === '/favicon.ico' ||
    cleanPath.startsWith('/favicon') ||
    cleanPath.startsWith('/storage') ||
    cleanPath.startsWith('/public') ||
    cleanPath.startsWith('/images')
  ) {
    return true;
  }

  return false;
}

/**
 * Sanitizes and validates post-login redirect targets.
 * Prevents 404 Not Found errors, redirect loops, open redirects, and unauthorized elevation.
 */
export function getSafeRedirectUrl(target?: string | null, userRole: string = 'citizen'): string {
  if (!target) return '/dashboard';
  let decoded = target;
  try {
    decoded = decodeURIComponent(target);
  } catch {
    // If decoding fails, continue with raw target
  }

  decoded = decoded.trim();

  // If empty or circular redirect back to login/register/auth portals
  if (
    !decoded ||
    decoded === '/' ||
    decoded === '/login' ||
    decoded.startsWith('/login?') ||
    decoded === '/register' ||
    decoded.startsWith('/register?') ||
    decoded === '/signup' ||
    decoded.startsWith('/signup?') ||
    decoded === '/auth' ||
    decoded === '/auth/' ||
    decoded === '/auth/login' ||
    decoded.startsWith('/auth/login?') ||
    decoded === '/auth/register' ||
    decoded.startsWith('/auth/register?') ||
    decoded.startsWith('/forgot-password') ||
    decoded.startsWith('/reset-password')
  ) {
    return userRole === 'officer' ? '/officer' : userRole === 'admin' ? '/admin' : '/dashboard';
  }

  // Ensure relative path starts with a leading slash to prevent nested subpath 404s
  if (!decoded.startsWith('/') && !decoded.startsWith('http://') && !decoded.startsWith('https://')) {
    decoded = '/' + decoded;
  }

  // Block external redirects (open redirect vulnerability)
  if (decoded.startsWith('//') || decoded.startsWith('http://') || decoded.startsWith('https://')) {
    return userRole === 'officer' ? '/officer' : userRole === 'admin' ? '/admin' : '/dashboard';
  }

  // Map directory routes with no index page to their intended destinations
  if (decoded === '/records' || decoded === '/records/') return '/search';
  if (decoded === '/reports' || decoded === '/reports/') return '/verify';

  // Prevent Citizens from being mistakenly redirected to officer or admin routes
  if (userRole === 'citizen') {
    if (decoded.startsWith('/officer') || decoded.startsWith('/admin')) {
      return '/dashboard';
    }
  }

  // Prevent Land Officers from being sent to admin routes
  if (userRole === 'officer' && decoded.startsWith('/admin')) {
    return '/officer';
  }

  return decoded;
}
