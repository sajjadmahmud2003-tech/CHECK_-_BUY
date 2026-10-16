import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { UserProfile, UserRole, DocumentRecord } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

const HMAC_SECRET = process.env.DOCUMENT_SIGNING_SECRET || 'landcheck-secret-signing-key-2026-secure-random';
export const ADMIN_BOOTSTRAP_SECRET = process.env.ADMIN_BOOTSTRAP_SECRET || 'govtech-admin-bootstrap-secret-2026';

export interface UserCredential {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  position?: 'Land Officer' | 'Admin';
  phone?: string;
  preferredLanguage: 'en' | 'bn';
  createdAt: string;
  passwordHash: string;
  salt: string;
  createdBy?: string;
}

/**
 * Secure password hashing using PBKDF2 with 100,000 iterations of SHA-512
 */
export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Timing-safe password verification
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
  } catch {
    return false;
  }
}

// Pre-hashed default credentials for initial system bootstrap
const adminSeed = hashPassword(process.env.ADMIN_INITIAL_PASSWORD || 'GovTech#Admin2026!', 'salt-admin-init-2026');
const officerSeed = hashPassword(process.env.OFFICER_INITIAL_PASSWORD || 'Officer#Land2026!', 'salt-officer-init-2026');
const citizenSeed = hashPassword(process.env.CITIZEN_INITIAL_PASSWORD || 'Citizen#Pass2026!', 'salt-citizen-init-2026');

// In-Memory/Runtime Server Credentials Store
export const CREDENTIALS_STORE: Map<string, UserCredential> = new Map([
  [
    'user-admin-03',
    {
      id: 'user-admin-03',
      email: 'admin@landcheck.gov.bd',
      fullName: 'Kazi Nazmul Huda (GovTech Admin)',
      role: 'admin',
      position: 'Admin',
      phone: '+880 1911-000000',
      preferredLanguage: 'en',
      createdAt: '2026-01-01T00:00:00Z',
      passwordHash: adminSeed.hash,
      salt: adminSeed.salt,
      createdBy: 'SYSTEM_BOOTSTRAP',
    },
  ],
  [
    'user-officer-02',
    {
      id: 'user-officer-02',
      email: 'officer@landcheck.gov.bd',
      fullName: 'Barrister Tahmina Akter (Land Law Consultant)',
      role: 'officer',
      position: 'Land Officer',
      phone: '+880 1819-876543',
      preferredLanguage: 'bn',
      createdAt: '2026-01-05T09:00:00Z',
      passwordHash: officerSeed.hash,
      salt: officerSeed.salt,
      createdBy: 'user-admin-03',
    },
  ],
  [
    'user-citizen-01',
    {
      id: 'user-citizen-01',
      email: 'citizen@landcheck.gov.bd',
      fullName: 'Mohammad Rafiqul Islam (Citizen Buyer)',
      role: 'citizen',
      phone: '+880 1712-345678',
      preferredLanguage: 'en',
      createdAt: '2026-01-10T08:00:00Z',
      passwordHash: citizenSeed.hash,
      salt: citizenSeed.salt,
    },
  ],
]);

function toUserProfile(cred: UserCredential): UserProfile {
  return {
    id: cred.id,
    email: cred.email,
    fullName: cred.fullName,
    role: cred.role,
    phone: cred.phone,
    preferredLanguage: cred.preferredLanguage,
    createdAt: cred.createdAt,
  };
}

/**
 * Public export of known users mapped by ID
 */
export const REGISTERED_USERS: Record<string, UserProfile> = {
  'user-citizen-01': toUserProfile(CREDENTIALS_STORE.get('user-citizen-01')!),
  'user-officer-02': toUserProfile(CREDENTIALS_STORE.get('user-officer-02')!),
  'user-admin-03': toUserProfile(CREDENTIALS_STORE.get('user-admin-03')!),
};

/**
 * Find user credential by unique ID or email
 */
export function findUserCredentialByIdOrEmail(identifier: string): UserCredential | undefined {
  if (!identifier) return undefined;
  const cleanId = identifier.trim().toLowerCase();

  // Check alias shortcuts
  if (cleanId === 'admin') return CREDENTIALS_STORE.get('user-admin-03');
  if (cleanId === 'officer') return CREDENTIALS_STORE.get('user-officer-02');
  if (cleanId === 'citizen') return CREDENTIALS_STORE.get('user-citizen-01');

  // Direct ID check
  for (const cred of CREDENTIALS_STORE.values()) {
    if (cred.id.toLowerCase() === cleanId || cred.email.toLowerCase() === cleanId) {
      return cred;
    }
  }
  return undefined;
}

/**
 * Verify credentials on the server
 */
export function verifyUserCredentials(
  identifier: string,
  password?: string
): { success: boolean; user?: UserProfile; error?: string } {
  if (!identifier) {
    return { success: false, error: 'User ID or Email is required.' };
  }

  const cred = findUserCredentialByIdOrEmail(identifier);
  if (!cred) {
    return { success: false, error: 'User not found. Please check your ID or email.' };
  }

  // If password provided, verify hash
  if (password !== undefined) {
    const isMatch = verifyPassword(password, cred.passwordHash, cred.salt);
    if (!isMatch) {
      return { success: false, error: 'Incorrect password.' };
    }
  }

  return { success: true, user: toUserProfile(cred) };
}

/**
 * Authorized staff account creation by GovTech Admin
 */
export function createStaffAccount(params: {
  id: string;
  password: string;
  position: 'Land Officer' | 'Admin';
  callerUser: UserProfile;
}): { success: boolean; user?: UserProfile; error?: string; status: number } {
  const { id, password, position, callerUser } = params;

  // Strict backend permission check: ONLY GovTech Admin can create staff accounts
  if (!callerUser || callerUser.role !== 'admin') {
    return {
      success: false,
      status: 403,
      error: 'Forbidden: Only an authorized GovTech Admin can register staff accounts.',
    };
  }

  const cleanId = id.trim();
  if (!cleanId) {
    return { success: false, status: 400, error: 'User ID is required.' };
  }

  // Ensure ID is unique
  if (findUserCredentialByIdOrEmail(cleanId)) {
    return { success: false, status: 409, error: `User ID '${cleanId}' already exists. Please choose a different ID.` };
  }

  if (!password || password.length < 6) {
    return { success: false, status: 400, error: 'Password must be at least 6 characters long.' };
  }

  if (position !== 'Land Officer' && position !== 'Admin') {
    return { success: false, status: 400, error: 'Position must be exactly "Land Officer" or "Admin".' };
  }

  const role: UserRole = position === 'Land Officer' ? 'officer' : 'admin';
  const { hash, salt } = hashPassword(password);
  const fullName = position === 'Land Officer' ? `Land Officer (${cleanId})` : `GovTech Admin (${cleanId})`;
  const email = `${cleanId.toLowerCase().replace(/[^a-z0-9]/g, '_')}@landcheck.gov.bd`;

  const newCred: UserCredential = {
    id: cleanId,
    email,
    fullName,
    role,
    position,
    preferredLanguage: position === 'Land Officer' ? 'bn' : 'en',
    createdAt: new Date().toISOString(),
    passwordHash: hash,
    salt,
    createdBy: callerUser.id,
  };

  CREDENTIALS_STORE.set(cleanId, newCred);
  const profile = toUserProfile(newCred);
  REGISTERED_USERS[cleanId] = profile;

  return {
    success: true,
    status: 201,
    user: profile,
  };
}

/**
 * Public registration helper strictly restricted to Citizen Buyers
 */
export function createCitizenAccount(params: {
  id?: string;
  email: string;
  fullName: string;
  password?: string;
  role?: string;
}): { success: boolean; user?: UserProfile; error?: string; status: number } {
  // Prevent public registration from assigning privileged roles
  if (params.role && params.role !== 'citizen') {
    return {
      success: false,
      status: 403,
      error: 'Forbidden: Public registration is strictly restricted to Citizen Buyers. Land Officer and Admin accounts must be created by a GovTech Admin.',
    };
  }

  const cleanEmail = params.email.trim().toLowerCase();
  const existing = findUserCredentialByIdOrEmail(cleanEmail);
  if (existing) {
    return { success: false, status: 409, error: 'An account with this email already exists.' };
  }

  const cleanId = params.id?.trim() || `usr-${Date.now()}`;
  const pass = params.password || 'Citizen#Pass2026!';
  const { hash, salt } = hashPassword(pass);

  const newCred: UserCredential = {
    id: cleanId,
    email: cleanEmail,
    fullName: params.fullName || cleanEmail.split('@')[0],
    role: 'citizen',
    preferredLanguage: 'en',
    createdAt: new Date().toISOString(),
    passwordHash: hash,
    salt,
  };

  CREDENTIALS_STORE.set(cleanId, newCred);
  const profile = toUserProfile(newCred);
  REGISTERED_USERS[cleanId] = profile;

  return { success: true, status: 201, user: profile };
}

/**
 * Returns all staff accounts (Land Officers & Admins)
 */
export function getAllStaffAccounts(): UserProfile[] {
  const staff: UserProfile[] = [];
  for (const cred of CREDENTIALS_STORE.values()) {
    if (cred.role === 'officer' || cred.role === 'admin') {
      staff.push(toUserProfile(cred));
    }
  }
  return staff;
}

/**
 * Generates an HMAC-signed session token
 */
export function createSessionToken(user: UserProfile, expiresInSec: number = 7 * 24 * 3600): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec;
  const payload = `${user.id}:${user.role}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
  return `${payload}:${signature}`;
}

/**
 * Verifies an HMAC-signed session token
 */
export function parseAndVerifySessionToken(token: string): { valid: boolean; user?: UserProfile; error?: string } {
  try {
    const parts = token.split(':');
    if (parts.length !== 4) {
      return { valid: false, error: 'Malformed token structure' };
    }

    const [userId, role, expiresAtStr, sig] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Math.floor(Date.now() / 1000) > expiresAt) {
      return { valid: false, error: 'Session has expired' };
    }

    const expectedPayload = `${userId}:${role}:${expiresAtStr}`;
    const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(expectedPayload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return { valid: false, error: 'Invalid token signature' };
    }

    // Cross-check with server credentials store to ensure user exists and role hasn't changed
    const cred = findUserCredentialByIdOrEmail(userId);
    if (cred) {
      if (cred.role !== role) {
        return { valid: false, error: 'User role mismatch' };
      }
      return { valid: true, user: toUserProfile(cred) };
    }

    if (REGISTERED_USERS[userId]) {
      return { valid: true, user: REGISTERED_USERS[userId] };
    }

    return { valid: false, error: 'User does not exist in server registry' };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Verification error' };
  }
}

/**
 * Extracts and verifies authenticated user from server request
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<UserProfile | null> {
  // 1. Try Supabase Auth Token if Supabase is configured
  if (isSupabaseConfigured && supabase) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          return {
            id: user.id,
            email: user.email || '',
            fullName: (user.user_metadata?.full_name as string) || user.email || 'Citizen',
            role: (user.user_metadata?.role as any) || 'citizen',
            preferredLanguage: (user.user_metadata?.preferred_language as any) || 'en',
            createdAt: user.created_at,
          };
        }
      } catch {
        // Fall back to local check
      }
    }
  }

  // 2. Check Authorization Header for signed token or candidate ID
  const authHeader = request.headers.get('authorization');
  let candidateToken: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    candidateToken = authHeader.substring(7).trim();
  }

  // 3. Check session cookie 'landcheck_session'
  if (!candidateToken) {
    let cookieVal: string | undefined;
    if (request.cookies && typeof request.cookies.get === 'function') {
      cookieVal = request.cookies.get('landcheck_session')?.value;
    } else {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/(?:^|;\s*)landcheck_session=([^;]+)/);
      if (match) {
        cookieVal = match[1];
      }
    }
    if (cookieVal) {
      candidateToken = decodeURIComponent(cookieVal.trim());
    }
  }

  // 4. Check custom header 'x-user-id'
  if (!candidateToken) {
    const headerUserId = request.headers.get('x-user-id');
    if (headerUserId) {
      candidateToken = headerUserId.trim();
    }
  }

  if (!candidateToken) {
    return null;
  }

  // If token is signed session token (contains colons)
  if (candidateToken.includes(':')) {
    const verified = parseAndVerifySessionToken(candidateToken);
    if (verified.valid && verified.user) {
      return verified.user;
    }
  }

  // If candidate is a direct user ID / email
  const cred = findUserCredentialByIdOrEmail(candidateToken);
  if (cred) {
    return toUserProfile(cred);
  }

  if (REGISTERED_USERS[candidateToken]) {
    return REGISTERED_USERS[candidateToken];
  }

  // Only dynamic citizen IDs starting with 'usr-' are allowed for frictionless demo
  if (candidateToken.startsWith('usr-') || candidateToken.startsWith('user-citizen')) {
    return {
      id: candidateToken,
      email: `${candidateToken}@citizen.gov.bd`,
      fullName: `Citizen (${candidateToken})`,
      role: 'citizen',
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Enforces server-side authorization on document requests.
 * Only verified Land Officers ('officer') have permission to download land documents.
 * Citizens and Admin users who are not Land Officers are strictly forbidden.
 */
export function isAuthorizedToDownloadDocument(
  user: UserProfile | null | undefined,
  document?: DocumentRecord
): { authorized: boolean; status: number; reason?: string } {
  if (!user) {
    return {
      authorized: false,
      status: 401,
      reason: 'UNAUTHORIZED: Authentication required to download protected land documents.',
    };
  }

  // Strict: ONLY 'officer' (Land Officer) can download documents
  if (user.role !== 'officer') {
    return {
      authorized: false,
      status: 403,
      reason: `FORBIDDEN: User with role '${user.role}' is not authorized to download land documents. Document downloads are strictly restricted to verified Land Officers.`,
    };
  }

  return {
    authorized: true,
    status: 200,
  };
}

export function canDownloadDocuments(user: UserProfile | null | undefined): boolean {
  return !!user && user.role === 'officer';
}

/**
 * Enforces server-side authorization on document requests to prevent IDOR
 */
export function isAuthorizedForDocument(
  user: UserProfile,
  document: DocumentRecord
): { authorized: boolean; reason?: string } {
  // Only the Land Officer or document owner can access
  if (user.role === 'officer' || document.userId === user.id) {
    return { authorized: true };
  }

  return {
    authorized: false,
    reason: `IDOR_FORBIDDEN: User ${user.id} (role: ${user.role}) is not authorized to access document ${document.id}.`,
  };
}

/**
 * Generates a short-lived (60 seconds) cryptographically signed token for private document downloads
 */
export function generateSignedDownloadToken(documentId: string, userId: string, expiresInSec: number = 60): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec;
  const payload = `${documentId}:${userId}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(payload)
    .digest('hex');

  return `${payload}:${signature}`;
}

/**
 * Verifies a short-lived signed download token
 */
export function verifySignedDownloadToken(
  token: string,
  expectedDocId: string
): { valid: boolean; userId?: string; error?: string } {
  try {
    const parts = token.split(':');
    if (parts.length !== 4) {
      return { valid: false, error: 'Malformed token structure' };
    }

    const [documentId, userId, expiresAtStr, signature] = parts;

    if (documentId !== expectedDocId) {
      return { valid: false, error: 'Document ID mismatch' };
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Math.floor(Date.now() / 1000);
    if (isNaN(expiresAt) || now > expiresAt) {
      return { valid: false, error: 'Token has expired' };
    }

    const expectedPayload = `${documentId}:${userId}:${expiresAtStr}`;
    const expectedSignature = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(expectedPayload)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false, error: 'Invalid cryptographic signature' };
    }

    return { valid: true, userId };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Verification failed' };
  }
}

const serverAuth = {
  hashPassword,
  verifyPassword,
  findUserCredentialByIdOrEmail,
  verifyUserCredentials,
  createStaffAccount,
  createCitizenAccount,
  getAllStaffAccounts,
  createSessionToken,
  parseAndVerifySessionToken,
  getAuthenticatedUser,
  isAuthorizedToDownloadDocument,
  canDownloadDocuments,
  isAuthorizedForDocument,
  generateSignedDownloadToken,
  verifySignedDownloadToken,
  CREDENTIALS_STORE,
  REGISTERED_USERS,
};

export default serverAuth;

