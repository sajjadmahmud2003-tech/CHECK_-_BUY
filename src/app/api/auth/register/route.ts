import { NextRequest, NextResponse } from 'next/server';
import { createCitizenAccount } from '@/lib/server-auth';
import { dataStore } from '@/lib/data-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, password, role } = body;

    // Strict security check: Public registration CANNOT register Land Officer or Admin accounts
    if (role && role !== 'citizen') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Public registration is strictly restricted to Citizen Buyers. Land Officer and GovTech Admin accounts must be created by an authorized GovTech Admin.',
          code: 'PRIVILEGED_ROLE_FORBIDDEN',
        },
        { status: 403 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const result = createCitizenAccount({
      fullName: fullName || email.split('@')[0],
      email,
      password,
      role: 'citizen',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    dataStore.logAction(
      'REGISTER_CITIZEN',
      'user',
      result.user!.id,
      `Citizen account created for ${email}`,
      result.user!.id
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Citizen account created successfully.',
        user: result.user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed.' },
      { status: 500 }
    );
  }
}
