import { NextRequest, NextResponse } from 'next/server';
import { verifyUserCredentials, createSessionToken } from '@/lib/server-auth';
import { dataStore } from '@/lib/data-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = (body.identifier || body.email || body.id || '').trim();
    const password = body.password || '';
    const expectedRole = body.expectedRole; // optional 'officer' | 'admin' | 'citizen'

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'User ID or email address is required.' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required.' },
        { status: 400 }
      );
    }

    // Verify credentials on the server
    const verification = verifyUserCredentials(identifier, password);
    if (!verification.success || !verification.user) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Invalid ID or password.' },
        { status: 401 }
      );
    }

    const user = verification.user;

    // Strict server-side role enforcement for dedicated login portals
    if (expectedRole) {
      if (user.role !== expectedRole) {
        let expectedRoleLabel = 'Authorized Staff';
        if (expectedRole === 'officer') expectedRoleLabel = 'Land Officer';
        if (expectedRole === 'admin') expectedRoleLabel = 'GovTech Admin';
        if (expectedRole === 'citizen') expectedRoleLabel = 'Citizen Buyer';

        return NextResponse.json(
          {
            success: false,
            error: `Access Denied: This login portal is strictly reserved for ${expectedRoleLabel} accounts. Your account has the role '${user.role}'.`,
          },
          { status: 403 }
        );
      }
    }

    const sessionToken = createSessionToken(user);

    // Audit log
    dataStore.logAction(
      'AUTH_LOGIN',
      'user',
      user.id,
      `User ${user.fullName} (${user.id}) logged in with role '${user.role}'${expectedRole ? ` via ${expectedRole} portal` : ''}`,
      user.id
    );

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      user,
      token: sessionToken,
    });

    // Set secure cookie
    response.cookies.set({
      name: 'landcheck_session',
      value: sessionToken,
      path: '/',
      httpOnly: false, // Accessible to client sync and server verification
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal authentication error.' },
      { status: 500 }
    );
  }
}

