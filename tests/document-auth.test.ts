import { describe, it, expect } from 'vitest';
import {
  isAuthorizedToDownloadDocument,
  canDownloadDocuments,
  REGISTERED_USERS,
} from '../src/lib/server-auth';
import { UserProfile } from '../src/types';

describe('Role-Based Document Download Permission Security', () => {
  const citizenUser: UserProfile = REGISTERED_USERS['user-citizen-01'];
  const officerUser: UserProfile = REGISTERED_USERS['user-officer-02'];
  const adminUser: UserProfile = REGISTERED_USERS['user-admin-03'];

  // 1. Unauthenticated checks
  it('rejects unauthenticated requests with 401 Unauthorized', () => {
    const result = isAuthorizedToDownloadDocument(null);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
    expect(result.reason).toContain('UNAUTHORIZED');
    expect(canDownloadDocuments(null)).toBe(false);
    expect(canDownloadDocuments(undefined)).toBe(false);
  });

  // 2. Citizen restrictions
  it('strictly forbids Citizens from downloading documents with 403 Forbidden', () => {
    expect(citizenUser.role).toBe('citizen');
    const result = isAuthorizedToDownloadDocument(citizenUser);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(403);
    expect(result.reason).toContain('FORBIDDEN');
    expect(result.reason).toContain('citizen');
    expect(canDownloadDocuments(citizenUser)).toBe(false);
  });

  // 3. Admin restrictions (Admin without Land Officer role)
  it('strictly forbids Admins without the Land Officer role from downloading documents with 403 Forbidden', () => {
    expect(adminUser.role).toBe('admin');
    const result = isAuthorizedToDownloadDocument(adminUser);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(403);
    expect(result.reason).toContain('FORBIDDEN');
    expect(result.reason).toContain('admin');
    expect(canDownloadDocuments(adminUser)).toBe(false);
  });

  // 4. Land Officer authorization
  it('grants download permissions ONLY to users with verified Land Officer role with 200 OK', () => {
    expect(officerUser.role).toBe('officer');
    const result = isAuthorizedToDownloadDocument(officerUser);
    expect(result.authorized).toBe(true);
    expect(result.status).toBe(200);
    expect(canDownloadDocuments(officerUser)).toBe(true);
  });

  // 5. Immediate revocation on role change
  it('immediately revokes download access when a user role changes from officer to citizen or admin', () => {
    let sessionUser: UserProfile = { ...officerUser };
    expect(canDownloadDocuments(sessionUser)).toBe(true);
    expect(isAuthorizedToDownloadDocument(sessionUser).authorized).toBe(true);

    // Downgrade / switch to citizen
    sessionUser = { ...sessionUser, role: 'citizen' };
    expect(canDownloadDocuments(sessionUser)).toBe(false);
    const citizenCheck = isAuthorizedToDownloadDocument(sessionUser);
    expect(citizenCheck.authorized).toBe(false);
    expect(citizenCheck.status).toBe(403);

    // Switch to admin
    sessionUser = { ...sessionUser, role: 'admin' };
    expect(canDownloadDocuments(sessionUser)).toBe(false);
    const adminCheck = isAuthorizedToDownloadDocument(sessionUser);
    expect(adminCheck.authorized).toBe(false);
    expect(adminCheck.status).toBe(403);

    // Switch back to officer
    sessionUser = { ...sessionUser, role: 'officer' };
    expect(canDownloadDocuments(sessionUser)).toBe(true);
    expect(isAuthorizedToDownloadDocument(sessionUser).authorized).toBe(true);
  });
});
