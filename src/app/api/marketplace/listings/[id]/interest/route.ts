import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { expressInterest, withdrawInterest, getListingById } from '@/lib/data-store';

/**
 * POST /api/marketplace/listings/[id]/interest
 * Authenticated buyer expresses or withdraws interest in a published land listing
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in to express interest in this property.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'express';

    if (action === 'withdraw') {
      const withdrawResult = withdrawInterest(id, user.id);
      if (!withdrawResult.success) {
        return NextResponse.json(
          { success: false, error: withdrawResult.error || 'Failed to withdraw interest.' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Your interest in this property has been withdrawn.',
      });
    }

    // Express interest
    const phone = (body.phone || user.phone || '01700-000000').trim();
    const email = user.email || 'buyer@landcheck.gov.bd';
    const message = (body.message || '').trim();

    const result = expressInterest(id, {
      id: user.id,
      name: user.fullName || 'Citizen Buyer',
      phone,
      email,
      message,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your interest has been communicated to the seller. The seller will review your contact details.',
      interest: result.interest,
    });
  } catch (error: any) {
    console.error('Error handling listing interest:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error processing interest.' },
      { status: 500 }
    );
  }
}
