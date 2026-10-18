import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  createCitizenAccount,
  createSessionToken,
  parseAndVerifySessionToken,
  getAuthenticatedUser,
  verifyUserCredentials,
  findUserCredentialByIdOrEmail,
  REGISTERED_USERS,
} from '../src/lib/server-auth';
import { getSafeRedirectUrl, isPublicPath } from '../src/lib/auth-routes';
import { middleware } from '../src/middleware';
import { POST as registerHandler } from '../src/app/api/auth/register/route';
import { POST as loginHandler } from '../src/app/api/auth/login/route';
import { GET as meHandler } from '../src/app/api/auth/me/route';

describe('CHECK_&_BUY — Citizen Login & Session Persistence Verification', () => {
  // Test 1: getSafeRedirectUrl sanitizes and prevents 404s
  describe('1. Redirect URL Sanitization & 404 Prevention', () => {
    it('redirects /records and /reports to valid routes instead of 404', () => {
      expect(getSafeRedirectUrl('/records', 'citizen')).toBe('/search');
      expect(getSafeRedirectUrl('/records/', 'citizen')).toBe('/search');
      expect(getSafeRedirectUrl('/reports', 'citizen')).toBe('/verify');
      expect(getSafeRedirectUrl('/reports/', 'citizen')).toBe('/verify');
      expect(getSafeRedirectUrl('/auth', 'citizen')).toBe('/dashboard');
    });

    it('prevents redirect loops back to login or register', () => {
      expect(getSafeRedirectUrl('/login', 'citizen')).toBe('/dashboard');
      expect(getSafeRedirectUrl('/login?next=%2Fdashboard', 'citizen')).toBe('/dashboard');
      expect(getSafeRedirectUrl('/register', 'citizen')).toBe('/dashboard');
      expect(getSafeRedirectUrl('/auth/login', 'citizen')).toBe('/dashboard');
      expect(getSafeRedirectUrl('', 'citizen')).toBe('/dashboard');
      expect(getSafeRedirectUrl(null, 'citizen')).toBe('/dashboard');
    });

    it('fixes relative paths missing leading slash', () => {
      expect(getSafeRedirectUrl('dashboard', 'citizen')).toBe('/dashboard');
      expect(getSafeRedirectUrl('search?q=101', 'citizen')).toBe('/search?q=101');
    });

    it('blocks open external redirects', () => {
      expect(getSafeRedirectUrl('https://evil.com/phish', 'citizen')).toBe('/dashboard');
      expect(getSafeRedirectUrl('//evil.com/phish', 'citizen')).toBe('/dashboard');
    });

    it('prevents Citizens from being redirected to officer or admin portals', () => {
      expect(getSafeRedirectUrl('/admin', 'citizen')).toBe('/dashboard');
      expect(getSafeRedirectUrl('/admin/register', 'citizen')).toBe('/dashboard');
      expect(getSafeRedirectUrl('/officer', 'citizen')).toBe('/dashboard');
    });

    it('preserves valid authorized citizen paths', () => {
      expect(getSafeRedirectUrl('/dashboard', 'citizen')).toBe('/dashboard');
      expect(getSafeRedirectUrl('/my-documents', 'citizen')).toBe('/my-documents');
      expect(getSafeRedirectUrl('/applications', 'citizen')).toBe('/applications');
      expect(getSafeRedirectUrl('/search', 'citizen')).toBe('/search');
      expect(getSafeRedirectUrl('/records/rec-dhanmondi-101', 'citizen')).toBe('/records/rec-dhanmondi-101');
    });
  });

  // Test 2: Middleware rewrites /records, /reports, /auth to prevent 404s
  describe('2. Middleware Route Handling', () => {
    it('redirects unauthenticated requests for /records to /login with next target', () => {
      const req = new NextRequest('http://localhost:3000/records');
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login?next=%2Frecords&notice=auth_required');
    });

    it('redirects authenticated sessions on /records to /search', () => {
      const req = new NextRequest('http://localhost:3000/records', {
        headers: {
          cookie: 'landcheck_session=user-citizen-01',
        },
      });
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/search');
    });

    it('redirects authenticated sessions on /reports to /verify', () => {
      const req = new NextRequest('http://localhost:3000/reports', {
        headers: {
          cookie: 'landcheck_session=user-citizen-01',
        },
      });
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/verify');
    });

    it('redirects /auth to /login', () => {
      const req = new NextRequest('http://localhost:3000/auth');
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });
  });

  // Test 3: Self-contained session tokens & verification across stateless environments
  describe('3. Self-Contained Signed Session Tokens', () => {
    it('creates a 5-part self-contained token containing user profile metadata', () => {
      const citizenUser = {
        id: 'usr-persistent-citizen-99',
        email: 'persistent@example.com',
        fullName: 'Persistent Citizen User',
        role: 'citizen' as const,
        phone: '+8801700000000',
        preferredLanguage: 'en' as const,
        createdAt: new Date().toISOString(),
      };

      const token = createSessionToken(citizenUser);
      expect(token).toBeDefined();
      const parts = token.split(':');
      expect(parts.length).toBe(5);
      expect(parts[0]).toBe('usr-persistent-citizen-99');
      expect(parts[1]).toBe('citizen');

      // Verify token in an isolated context
      const verification = parseAndVerifySessionToken(token);
      expect(verification.valid).toBe(true);
      expect(verification.user).toBeDefined();
      expect(verification.user!.id).toBe('usr-persistent-citizen-99');
      expect(verification.user!.email).toBe('persistent@example.com');
      expect(verification.user!.fullName).toBe('Persistent Citizen User');
      expect(verification.user!.role).toBe('citizen');
    });

    it('authenticates user from request with landcheck_session cookie', async () => {
      const citizenUser = {
        id: 'usr-req-citizen-88',
        email: 'request_user@example.com',
        fullName: 'Request Citizen User',
        role: 'citizen' as const,
        preferredLanguage: 'en' as const,
        createdAt: new Date().toISOString(),
      };

      const token = createSessionToken(citizenUser);
      const req = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          cookie: `landcheck_session=${encodeURIComponent(token)}`,
        },
      });

      const user = await getAuthenticatedUser(req);
      expect(user).not.toBeNull();
      expect(user!.id).toBe('usr-req-citizen-88');
      expect(user!.email).toBe('request_user@example.com');
      expect(user!.role).toBe('citizen');
    });
  });

  // Test 4: Registration API returns token and sets session cookie
  describe('4. Registration API Handler', () => {
    it('creates account, returns token, and sets landcheck_session cookie', async () => {
      const testEmail = `newcitizen_${Date.now()}@example.com`;
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Test New Citizen',
          email: testEmail,
          password: 'Citizen#Pass2026!',
          role: 'citizen',
        }),
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testEmail);
      expect(data.token).toBeDefined();

      // Check cookie was set
      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain('landcheck_session=');
    });
  });

  // Test 5: Login API handler creates valid session
  describe('5. Login API Handler & Existing User Persistence', () => {
    it('authenticates pre-seeded citizen account', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'citizen@landcheck.gov.bd',
          password: 'Citizen#Pass2026!',
        }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('citizen');
      expect(data.token).toBeDefined();

      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toContain('landcheck_session=');
    });

    it('rejects invalid credentials with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'citizen@landcheck.gov.bd',
          password: 'WrongPassword123!',
        }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });

  // Test 6: /api/auth/me session verification endpoint
  describe('6. /api/auth/me Session Verification Endpoint', () => {
    it('returns authenticated profile when session cookie is provided', async () => {
      const token = createSessionToken(REGISTERED_USERS['user-citizen-01']);
      const req = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          cookie: `landcheck_session=${encodeURIComponent(token)}`,
        },
      });

      const res = await meHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.id).toBe('user-citizen-01');
      expect(data.user.role).toBe('citizen');
    });

    it('returns 401 when no session cookie is provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/me');
      const res = await meHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });
});
