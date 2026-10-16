import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  verifyUserCredentials,
  createStaffAccount,
  createCitizenAccount,
  createSessionToken,
  parseAndVerifySessionToken,
  isAuthorizedToDownloadDocument,
  canDownloadDocuments,
  findUserCredentialByIdOrEmail,
  REGISTERED_USERS,
} from '../src/lib/server-auth';
import { UserProfile } from '../src/types';

describe('LandCheck AI — Authentication, Registration & Role-Based Security System', () => {
  const citizenUser: UserProfile = REGISTERED_USERS['user-citizen-01'];
  const officerUser: UserProfile = REGISTERED_USERS['user-officer-02'];
  const adminUser: UserProfile = REGISTERED_USERS['user-admin-03'];

  // 1. Password Hashing & Plain-Text Protection
  it('10. Passwords are securely hashed and never stored or returned as plain text', () => {
    const rawPassword = 'Secret#Password2026!';
    const { hash, salt } = hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.length).toBeGreaterThan(64);
    expect(salt.length).toBeGreaterThan(16);

    // Verifies timing-safe matching
    expect(verifyPassword(rawPassword, hash, salt)).toBe(true);
    expect(verifyPassword('WrongPassword', hash, salt)).toBe(false);

    // Registered user records do not expose password
    const adminCred = findUserCredentialByIdOrEmail('user-admin-03');
    expect(adminCred).toBeDefined();
    expect(adminCred?.passwordHash).not.toBe('GovTech#Admin2026!');
  });

  // 2. Authentication with valid credentials
  it('2 & 3. Land Officer and GovTech Admin can log in with their valid assigned ID and password', () => {
    // Admin login
    const adminAuth = verifyUserCredentials('user-admin-03', 'GovTech#Admin2026!');
    expect(adminAuth.success).toBe(true);
    expect(adminAuth.user?.role).toBe('admin');

    // Land Officer login
    const officerAuth = verifyUserCredentials('user-officer-02', 'Officer#Land2026!');
    expect(officerAuth.success).toBe(true);
    expect(officerAuth.user?.role).toBe('officer');

    // Invalid password fails
    const invalidAuth = verifyUserCredentials('user-admin-03', 'WrongPassword123');
    expect(invalidAuth.success).toBe(false);
    expect(invalidAuth.error).toContain('Incorrect password');

    // Non-existent user fails
    const nonExistent = verifyUserCredentials('unknown-user-id', 'AnyPass123');
    expect(nonExistent.success).toBe(false);
  });

  // 3. GovTech Admin can create a Land Officer account
  it('4. GovTech Admin can create a Land Officer account (Position: Land Officer)', () => {
    const newOfficerId = `officer-test-${Date.now()}`;
    const result = createStaffAccount({
      id: newOfficerId,
      password: 'Officer#NewPass2026!',
      position: 'Land Officer',
      callerUser: adminUser,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe(201);
    expect(result.user?.id).toBe(newOfficerId);
    expect(result.user?.role).toBe('officer');

    // Verify the newly created Land Officer can now log in
    const loginTest = verifyUserCredentials(newOfficerId, 'Officer#NewPass2026!');
    expect(loginTest.success).toBe(true);
    expect(loginTest.user?.role).toBe('officer');

    // Verify Land Officer can download protected documents
    expect(canDownloadDocuments(loginTest.user)).toBe(true);
  });

  // 4. GovTech Admin can create another GovTech Admin account
  it('5. GovTech Admin can create another GovTech Admin account (Position: Admin)', () => {
    const newAdminId = `admin-test-${Date.now()}`;
    const result = createStaffAccount({
      id: newAdminId,
      password: 'Admin#NewPass2026!',
      position: 'Admin',
      callerUser: adminUser,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe(201);
    expect(result.user?.id).toBe(newAdminId);
    expect(result.user?.role).toBe('admin');

    // Verify the newly created Admin can log in
    const loginTest = verifyUserCredentials(newAdminId, 'Admin#NewPass2026!');
    expect(loginTest.success).toBe(true);
    expect(loginTest.user?.role).toBe('admin');
  });

  // 5. Duplicate ID rejection
  it('Enforces unique ID and rejects duplicate staff registration with 409 Conflict', () => {
    const duplicateId = 'user-admin-03';
    const result = createStaffAccount({
      id: duplicateId,
      password: 'SomePassword123!',
      position: 'Land Officer',
      callerUser: adminUser,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(409);
    expect(result.error).toContain('already exists');
  });

  // 6. Citizen Buyer cannot create Land Officer or Admin account
  it('6. Citizen Buyer cannot create a Land Officer or GovTech Admin account (403 Forbidden)', () => {
    const resultOfficer = createStaffAccount({
      id: 'hacker-officer-99',
      password: 'HackerPassword123!',
      position: 'Land Officer',
      callerUser: citizenUser,
    });
    expect(resultOfficer.success).toBe(false);
    expect(resultOfficer.status).toBe(403);
    expect(resultOfficer.error).toContain('Forbidden');

    const resultAdmin = createStaffAccount({
      id: 'hacker-admin-99',
      password: 'HackerPassword123!',
      position: 'Admin',
      callerUser: citizenUser,
    });
    expect(resultAdmin.success).toBe(false);
    expect(resultAdmin.status).toBe(403);
    expect(resultAdmin.error).toContain('Forbidden');
  });

  // 7. Land Officer cannot create GovTech Admin account
  it('7. Land Officer cannot create a GovTech Admin or staff account (403 Forbidden)', () => {
    const result = createStaffAccount({
      id: 'officer-sub-99',
      password: 'SomePassword123!',
      position: 'Admin',
      callerUser: officerUser,
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toContain('Forbidden');
  });

  // 8. Public registration is strictly restricted to Citizen Buyers
  it('8. Public registration strictly enforces Citizen Buyer role and rejects privileged roles', () => {
    const hackerAttempt = createCitizenAccount({
      email: 'attacker@fraud.bd',
      fullName: 'Attacker',
      role: 'admin',
    });
    expect(hackerAttempt.success).toBe(false);
    expect(hackerAttempt.status).toBe(403);
    expect(hackerAttempt.error).toContain('Forbidden');

    // Valid citizen creation
    const citizenRegistration = createCitizenAccount({
      email: `citizen-${Date.now()}@test.bd`,
      fullName: 'Valid Citizen',
      role: 'citizen',
    });
    expect(citizenRegistration.success).toBe(true);
    expect(citizenRegistration.user?.role).toBe('citizen');
  });

  // 9. Session token security and tamper resistance
  it('9. Direct token tampering or URL forged roles do not bypass server verification', () => {
    const citizenToken = createSessionToken(citizenUser);
    const verification = parseAndVerifySessionToken(citizenToken);
    expect(verification.valid).toBe(true);
    expect(verification.user?.role).toBe('citizen');

    // Tampered token with elevated role
    const tamperedParts = citizenToken.split(':');
    tamperedParts[1] = 'admin'; // Attacker attempts to change role to admin
    const tamperedToken = tamperedParts.join(':');

    const tamperedCheck = parseAndVerifySessionToken(tamperedToken);
    expect(tamperedCheck.valid).toBe(false);
    expect(tamperedCheck.error).toBeDefined();
  });

  // 10. Role-based document access control
  it('1. Citizen Buyer cannot download protected documents; Land Officer can', () => {
    expect(isAuthorizedToDownloadDocument(citizenUser).authorized).toBe(false);
    expect(isAuthorizedToDownloadDocument(citizenUser).status).toBe(403);

    expect(isAuthorizedToDownloadDocument(adminUser).authorized).toBe(false);
    expect(isAuthorizedToDownloadDocument(adminUser).status).toBe(403);

    expect(isAuthorizedToDownloadDocument(officerUser).authorized).toBe(true);
    expect(isAuthorizedToDownloadDocument(officerUser).status).toBe(200);
  });

  // 11. Staff Registration API Route Tests
  describe('/api/admin/register API Route Security & Validation', () => {
    // Dynamic import to test Next.js route handlers
    it('Rejects unauthenticated requests with 401', async () => {
      const { POST } = await import('../src/app/api/admin/register/route');
      const req = new Request('http://localhost:3000/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'unauth-officer',
          pass: 'ValidPass123!',
          confirmPass: 'ValidPass123!',
          position: 'Land Officer',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('Rejects unauthorized roles (Citizen and Land Officer) with 403', async () => {
      const { POST } = await import('../src/app/api/admin/register/route');
      // Citizen attempt
      const citizenReq = new Request('http://localhost:3000/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-citizen-01',
        },
        body: JSON.stringify({
          id: 'citizen-forged-officer',
          pass: 'ValidPass123!',
          confirmPass: 'ValidPass123!',
          position: 'Land Officer',
        }),
      });

      const citizenRes = await POST(citizenReq as any);
      expect(citizenRes.status).toBe(403);

      // Officer attempt
      const officerReq = new Request('http://localhost:3000/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-officer-02',
        },
        body: JSON.stringify({
          id: 'officer-forged-admin',
          pass: 'ValidPass123!',
          confirmPass: 'ValidPass123!',
          position: 'Admin',
        }),
      });

      const officerRes = await POST(officerReq as any);
      expect(officerRes.status).toBe(403);
    });

    it('Rejects missing fields with 400', async () => {
      const { POST } = await import('../src/app/api/admin/register/route');
      const req = new Request('http://localhost:3000/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-admin-03',
        },
        body: JSON.stringify({
          id: '',
          pass: 'ValidPass123!',
          confirmPass: 'ValidPass123!',
          position: 'Land Officer',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Validation failed');
    });

    it('Rejects password and confirmPassword mismatch with 400', async () => {
      const { POST } = await import('../src/app/api/admin/register/route');
      const req = new Request('http://localhost:3000/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-admin-03',
        },
        body: JSON.stringify({
          id: 'valid-officer-id',
          pass: 'Password123!',
          confirmPass: 'DifferentPass123!',
          position: 'Land Officer',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('do not match');
    });

    it('Rejects invalid position (must be Land Officer or Admin) with 400', async () => {
      const { POST } = await import('../src/app/api/admin/register/route');
      const req = new Request('http://localhost:3000/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-admin-03',
        },
        body: JSON.stringify({
          id: 'test-invalid-position',
          pass: 'Password123!',
          confirmPass: 'Password123!',
          position: 'Superuser',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Position must be exactly');
    });

    it('Allows authorized GovTech Admin to provision a Land Officer account', async () => {
      const { POST } = await import('../src/app/api/admin/register/route');
      const testOfficerId = `api-officer-${Date.now()}`;
      const req = new Request('http://localhost:3000/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-admin-03',
        },
        body: JSON.stringify({
          id: testOfficerId,
          pass: 'OfficerPass2026!',
          confirmPass: 'OfficerPass2026!',
          position: 'Land Officer',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user?.id).toBe(testOfficerId);
      expect(json.user?.role).toBe('officer');
    });

    it('Allows authorized GovTech Admin to provision an Admin account', async () => {
      const { POST } = await import('../src/app/api/admin/register/route');
      const testAdminId = `api-admin-${Date.now()}`;
      const req = new Request('http://localhost:3000/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-admin-03',
        },
        body: JSON.stringify({
          id: testAdminId,
          pass: 'AdminPass2026!',
          confirmPass: 'AdminPass2026!',
          position: 'Admin',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user?.id).toBe(testAdminId);
      expect(json.user?.role).toBe('admin');
    });

    it('Rejects duplicate user ID with 409 Conflict', async () => {
      const { POST } = await import('../src/app/api/admin/register/route');
      const req = new Request('http://localhost:3000/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-admin-03',
        },
        body: JSON.stringify({
          id: 'user-admin-03',
          pass: 'SomePassword123!',
          confirmPass: 'SomePassword123!',
          position: 'Admin',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(409);
    });

    it('Allows GovTech Admin to list staff accounts via GET', async () => {
      const { GET } = await import('../src/app/api/admin/register/route');
      const req = new Request('http://localhost:3000/api/admin/register', {
        method: 'GET',
        headers: {
          'x-user-id': 'user-admin-03',
        },
      });

      const res = await GET(req as any);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.staff)).toBe(true);
      expect(json.staff.length).toBeGreaterThan(0);
    });
  });

  // ── Dedicated Staff Login & Role-Based Enforcement Tests ──
  describe('Dedicated Login Portals & Strict Role Enforcement (/api/auth/login)', () => {
    it('1. Citizen Buyer login continues to work as before', async () => {
      const { POST } = await import('../src/app/api/auth/login/route');
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'user-citizen-01',
          password: 'Citizen#Pass2026!',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user?.role).toBe('citizen');
      expect(json.token).toBeDefined();
    });

    it('2. Land Officer can log in through the Land Officer login route with valid credentials', async () => {
      const { POST } = await import('../src/app/api/auth/login/route');
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'user-officer-02',
          password: 'Officer#Land2026!',
          expectedRole: 'officer',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user?.role).toBe('officer');
      expect(json.token).toBeDefined();
    });

    it('3. GovTech Admin can log in through the GovTech Admin login route with valid credentials', async () => {
      const { POST } = await import('../src/app/api/auth/login/route');
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'user-admin-03',
          password: 'GovTech#Admin2026!',
          expectedRole: 'admin',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user?.role).toBe('admin');
      expect(json.token).toBeDefined();
    });

    it('4. A Land Officer cannot log in as GovTech Admin (rejected with 403 Forbidden)', async () => {
      const { POST } = await import('../src/app/api/auth/login/route');
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'user-officer-02',
          password: 'Officer#Land2026!',
          expectedRole: 'admin', // Land officer attempting GovTech Admin portal
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('GovTech Admin');
    });

    it('5. A GovTech Admin cannot log in as Land Officer unless assigned that role (rejected with 403 Forbidden)', async () => {
      const { POST } = await import('../src/app/api/auth/login/route');
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'user-admin-03',
          password: 'GovTech#Admin2026!',
          expectedRole: 'officer', // Admin attempting Land Officer portal
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Land Officer');
    });

    it('6. A Citizen Buyer cannot log in through Land Officer or GovTech Admin login portals', async () => {
      const { POST } = await import('../src/app/api/auth/login/route');
      
      // Citizen attempting Land Officer portal
      const officerAttempt = await POST(new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'user-citizen-01',
          password: 'Citizen#Pass2026!',
          expectedRole: 'officer',
        }),
      }) as any);
      expect(officerAttempt.status).toBe(403);

      // Citizen attempting GovTech Admin portal
      const adminAttempt = await POST(new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'user-citizen-01',
          password: 'Citizen#Pass2026!',
          expectedRole: 'admin',
        }),
      }) as any);
      expect(adminAttempt.status).toBe(403);
    });

    it('7. Invalid credentials or passwords are rejected with 401 Unauthorized', async () => {
      const { POST } = await import('../src/app/api/auth/login/route');
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'user-admin-03',
          password: 'WrongPassword!',
          expectedRole: 'admin',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Incorrect password');
    });

    it('8. Missing identifier or password returns 400 Bad Request', async () => {
      const { POST } = await import('../src/app/api/auth/login/route');
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '',
          password: '',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(400);
    });

    it('9. Public registration rejects any attempt to self-assign admin or officer role with 403 Forbidden', async () => {
      const { POST } = await import('../src/app/api/auth/register/route');
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Attacker Self Grant',
          email: `attacker-${Date.now()}@test.com`,
          password: 'Password123!',
          role: 'admin',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Forbidden');
    });

    it('10. Public registration rejects invalid email format with 400 Bad Request', async () => {
      const { POST } = await import('../src/app/api/auth/register/route');
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Test User',
          email: 'invalid-email-format',
          password: 'Password123!',
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(400);
    });
  });
});

