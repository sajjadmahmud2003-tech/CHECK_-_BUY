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
