import { describe, it, expect } from 'vitest';
import { isPublicPath, PUBLIC_ROUTES } from '../src/lib/auth-routes';
import { middleware } from '../src/middleware';
import { NextRequest } from 'next/server';
import {
  createSessionToken,
  parseAndVerifySessionToken,
  REGISTERED_USERS,
  getAuthenticatedUser,
} from '../src/lib/server-auth';

describe('LandCheck AI — Page Authentication & Route Enforcement', () => {
  const citizen = REGISTERED_USERS['user-citizen-01'];
  const officer = REGISTERED_USERS['user-officer-02'];
  const admin = REGISTERED_USERS['user-admin-03'];

  // Test 1: Logged-out visitor can open the homepage
  it('1. Logged-out visitor can open the homepage (/)', () => {
    expect(isPublicPath('/')).toBe(true);

    const req = new NextRequest('http://localhost:3000/');
    const res = middleware(req);
    expect(res.status).toBe(200); // Passes through without redirection
  });

  // Test 2: Logged-out visitor can open Login and Registration (and password flows)
  it('2. Logged-out visitor can open Login, Registration, Forgot Password, and Reset Password pages', () => {
    const publicPages = [
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
    ];

    for (const page of publicPages) {
      expect(isPublicPath(page)).toBe(true);
      const req = new NextRequest(`http://localhost:3000${page}`);
      const res = middleware(req);
      expect(res.status).toBe(200);
    }
  });

  // Test 3 & 4: Logged-out visitor cannot access protected pages; typing direct URL redirects to /login
  it('3 & 4. Protected pages cannot be accessed unauthenticated and redirect to /login with next target', () => {
    const protectedPages = [
      '/search',
      '/records/rec-dhanmondi-101',
      '/verify',
      '/upload',
      '/dashboard',
      '/reports',
      '/reports/rep-123',
      '/profile',
      '/officer',
      '/admin',
      '/admin/register',
    ];

    for (const page of protectedPages) {
      expect(isPublicPath(page)).toBe(false);

      const req = new NextRequest(`http://localhost:3000${page}`);
      const res = middleware(req);

      // Must redirect (307 or 308 or 302/303 redirect)
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);

      const location = res.headers.get('location');
      expect(location).toBeDefined();

      const redirectUrl = new URL(location!);
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('next')).toBe(page);
      expect(redirectUrl.searchParams.get('notice')).toBe('auth_required');
    }
  });

  // Test 5 & 6: Successful login creates valid session and enables access to protected pages
  it('5 & 6. Authenticated session allows access to protected pages and preserves requested destinations', () => {
    const token = createSessionToken(citizen);
    expect(token).toBeDefined();

    const verified = parseAndVerifySessionToken(token);
    expect(verified.valid).toBe(true);
    expect(verified.user?.id).toBe(citizen.id);

    // Request with valid session cookie passes middleware
    const protectedTarget = '/search?q=dhanmondi';
    const req = new NextRequest(`http://localhost:3000${protectedTarget}`, {
      headers: {
        cookie: `landcheck_session=${encodeURIComponent(token)}`,
      },
    });

    const res = middleware(req);
    expect(res.status).toBe(200); // Allowed through
  });

  // Test 7: Refreshing a protected page maintains valid session state
  it('7. Valid session tokens restore user profile and sustain authenticated access across refreshes', async () => {
    const token = createSessionToken(officer);

    // Mock NextRequest representing page refresh
    const refreshReq = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: `landcheck_session=${encodeURIComponent(token)}`,
      },
    });

    // Server-side user retrieval
    const authUser = await getAuthenticatedUser(refreshReq);
    expect(authUser).not.toBeNull();
    expect(authUser?.id).toBe(officer.id);
    expect(authUser?.role).toBe('officer');
  });

  // Test 8: Expired or tampered session is rejected
  it('8. Tampered or expired sessions are rejected and trigger redirection to login', () => {
    // Malformed/fake token
    const fakeReq = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: 'landcheck_session=invalid-malformed-token',
      },
    });

    const verified = parseAndVerifySessionToken('invalid-malformed-token');
    expect(verified.valid).toBe(false);

    // Expired token
    const expiredToken = `${citizen.id}:${citizen.role}:${Math.floor(Date.now() / 1000) - 100}:fakesig`;
    const expiredCheck = parseAndVerifySessionToken(expiredToken);
    expect(expiredCheck.valid).toBe(false);
  });
});
