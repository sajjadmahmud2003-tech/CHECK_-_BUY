import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import serverAuth, {
  getAuthenticatedUser,
  createStaffAccount,
  getAllStaffAccounts,
  hashPassword,
  findUserCredentialByIdOrEmail,
  CREDENTIALS_STORE,
  REGISTERED_USERS,
} from '@/lib/server-auth';
import { dataStore } from '@/lib/data-store';
import { UserRole, UserProfile } from '@/types';

/**
 * GovTech Admin Registration API
 * Strictly restricted to authorized GovTech Admins
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Enforce Server-Side Authentication
    const authFn =
      (typeof getAuthenticatedUser === 'function' ? getAuthenticatedUser : null) ||
      (typeof (serverAuth as any)?.getAuthenticatedUser === 'function' ? (serverAuth as any).getAuthenticatedUser : null);

    const callerUser = authFn ? await authFn(request) : null;
    if (!callerUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Authentication required to access staff registration.',
          code: 'UNAUTHENTICATED',
        },
        { status: 401 }
      );
    }

    // 2. Strict Role Verification: ONLY GovTech Admin can register Land Officer or Admin accounts
    if (callerUser.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: User with role '${callerUser.role}' is not authorized to register privileged staff accounts. Access restricted to GovTech Admin.`,
          code: 'ROLE_FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 3. Parse and validate form fields
    const body = await request.json();
    const id = (body.id || body.ID || '').trim();
    const pass = body.pass || body.password || '';
    const confirmPass = body.confirmPass || body.confirmPassword || '';
    const position = body.position || body.Position || '';

    // Validate required fields
    if (!id || !pass || !confirmPass || !position) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: ID, Pass, Confirm Pass, and Position are all required.',
        },
        { status: 400 }
      );
    }

    // Validate password match
    if (pass !== confirmPass) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: Pass and Confirm Pass do not match.',
        },
        { status: 400 }
      );
    }

    // Validate position dropdown: EXACTLY "Land Officer" or "Admin"
    if (position !== 'Land Officer' && position !== 'Admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: Position must be exactly "Land Officer" or "Admin".',
        },
        { status: 400 }
      );
    }

    // Password length validation
    if (pass.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: Pass must be at least 6 characters long.',
        },
        { status: 400 }
      );
    }

    // 4. Create Staff Account (hashes password with salt, validates ID uniqueness)
    let result: { success: boolean; user?: UserProfile; error?: string; status: number };

    const createFn =
      (typeof createStaffAccount === 'function' ? createStaffAccount : null) ||
      (typeof (serverAuth as any)?.createStaffAccount === 'function' ? (serverAuth as any).createStaffAccount : null);

    if (createFn) {
      result = createFn({
        id,
        password: pass,
        position,
        callerUser,
      });
    } else {
      // Direct server-side implementation if Turbopack fails cross-module function binding
      const cleanId = id.trim();
      const existing =
        (CREDENTIALS_STORE && CREDENTIALS_STORE.get(cleanId)) ||
        (REGISTERED_USERS && REGISTERED_USERS[cleanId]) ||
        (typeof findUserCredentialByIdOrEmail === 'function' ? findUserCredentialByIdOrEmail(cleanId) : null);

      if (existing) {
        return NextResponse.json(
          { success: false, error: `User ID '${cleanId}' already exists. Please choose a different ID.` },
          { status: 409 }
        );
      }

      const role: UserRole = position === 'Land Officer' ? 'officer' : 'admin';
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(pass, salt, 100000, 64, 'sha512').toString('hex');
      const fullName = position === 'Land Officer' ? `Land Officer (${cleanId})` : `GovTech Admin (${cleanId})`;
      const email = `${cleanId.toLowerCase().replace(/[^a-z0-9]/g, '_')}@landcheck.gov.bd`;

      const newCred = {
        id: cleanId,
        email,
        fullName,
        role,
        position,
        preferredLanguage: (position === 'Land Officer' ? 'bn' : 'en') as 'bn' | 'en',
        createdAt: new Date().toISOString(),
        passwordHash: hash,
        salt,
        createdBy: callerUser.id,
      };

      if (CREDENTIALS_STORE) {
        CREDENTIALS_STORE.set(cleanId, newCred);
      }

      const profile: UserProfile = {
        id: newCred.id,
        email: newCred.email,
        fullName: newCred.fullName,
        role: newCred.role,
        preferredLanguage: newCred.preferredLanguage,
        createdAt: newCred.createdAt,
      };

      if (REGISTERED_USERS) {
        REGISTERED_USERS[cleanId] = profile;
      }

      result = {
        success: true,
        status: 201,
        user: profile,
      };
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    // 5. Audit Log (Never log passwords)
    dataStore.logAction(
      'REGISTER_STAFF_ACCOUNT',
      'user',
      result.user!.id,
      `GovTech Admin ${callerUser.fullName} (${callerUser.email}) provisioned new ${position} account with ID '${id}'`,
      callerUser.id
    );

    return NextResponse.json(
      {
        success: true,
        message: `${position} account provisioned successfully. User can now sign in with ID '${id}'.`,
        user: result.user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal registration error.' },
      { status: 500 }
    );
  }
}

/**
 * List all existing staff accounts for GovTech Admin review
 */
export async function GET(request: NextRequest) {
  try {
    const authFn =
      (typeof getAuthenticatedUser === 'function' ? getAuthenticatedUser : null) ||
      (typeof (serverAuth as any)?.getAuthenticatedUser === 'function' ? (serverAuth as any).getAuthenticatedUser : null);

    const callerUser = authFn ? await authFn(request) : null;
    if (!callerUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    if (callerUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access restricted to GovTech Admin.' },
        { status: 403 }
      );
    }

    let staff: UserProfile[] = [];
    const getStaffFn =
      (typeof getAllStaffAccounts === 'function' ? getAllStaffAccounts : null) ||
      (typeof (serverAuth as any)?.getAllStaffAccounts === 'function' ? (serverAuth as any).getAllStaffAccounts : null);

    if (getStaffFn) {
      staff = getStaffFn();
    } else if (CREDENTIALS_STORE) {
      for (const cred of CREDENTIALS_STORE.values()) {
        if (cred.role === 'officer' || cred.role === 'admin') {
          staff.push({
            id: cred.id,
            email: cred.email,
            fullName: cred.fullName,
            role: cred.role,
            phone: cred.phone,
            preferredLanguage: cred.preferredLanguage,
            createdAt: cred.createdAt,
          });
        }
      }
    } else if (REGISTERED_USERS) {
      staff = Object.values(REGISTERED_USERS).filter(u => u.role === 'officer' || u.role === 'admin');
    }

    return NextResponse.json({ success: true, staff });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
