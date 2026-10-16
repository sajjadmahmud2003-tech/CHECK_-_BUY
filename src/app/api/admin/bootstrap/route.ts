import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_BOOTSTRAP_SECRET, hashPassword, findUserCredentialByIdOrEmail, REGISTERED_USERS } from '@/lib/server-auth';
import { dataStore } from '@/lib/data-store';

/**
 * Secure one-time/environment-controlled Bootstrap Endpoint for GovTech Admin
 */
export async function POST(request: NextRequest) {
  try {
    const secretHeader = request.headers.get('x-bootstrap-secret');

    // Strict validation against environment-configured secret
    if (!secretHeader || secretHeader !== ADMIN_BOOTSTRAP_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Invalid or missing bootstrap secret.',
          code: 'BOOTSTRAP_FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const id = (body.id || 'user-admin-03').trim();
    const password = body.password || 'GovTech#Admin2026!';
    const fullName = body.fullName || 'Kazi Nazmul Huda (GovTech Admin)';
    const email = body.email || 'admin@landcheck.gov.bd';

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const { hash, salt } = hashPassword(password);
    const existing = findUserCredentialByIdOrEmail(id);

    if (existing) {
      existing.passwordHash = hash;
      existing.salt = salt;
      existing.fullName = fullName;
      existing.email = email;
      existing.role = 'admin';
      existing.position = 'Admin';
    }

    dataStore.logAction(
      'ADMIN_BOOTSTRAP',
      'user',
      id,
      `Master GovTech Admin bootstrap initialized for ${id}`,
      id
    );

    return NextResponse.json(
      {
        success: true,
        message: 'GovTech Admin bootstrap completed successfully.',
        adminId: id,
        email,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Bootstrap error.' },
      { status: 500 }
    );
  }
}
