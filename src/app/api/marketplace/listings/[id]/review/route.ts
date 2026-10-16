import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { updateListingStatus, getListingById } from '@/lib/data-store';
import { ListingStatus, ListingVerificationStatus } from '@/types';

/**
 * POST /api/marketplace/listings/[id]/review
 * Moderation review of a land listing (Officers & Admins only)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to review listings.' },
        { status: 401 }
      );
    }

    if (user.role !== 'officer' && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only authorized Land Officers and Admins can moderate listings.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const listing = getListingById(id);
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found.' },
        { status: 404 }
      );
    }

    // A seller cannot moderate their own listing even if they possess officer role in test
    if (listing.sellerId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Conflict of interest: You cannot review or approve your own listing.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const newStatus = body.status as ListingStatus;

    const validStatuses: ListingStatus[] = [
      'Draft',
      'Pending Review',
      'Under Review',
      'Correction Required',
      'Published',
      'Rejected',
      'Sold',
      'Closed',
    ];

    if (!newStatus || !validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid listing status.' },
        { status: 400 }
      );
    }

    // Reason required for rejection or corrections
    const reason = (body.reason || '').trim();
    const correctionInstructions = (body.correctionInstructions || '').trim();

    if (newStatus === 'Rejected' && !reason) {
      return NextResponse.json(
        { success: false, error: 'A specific rejection reason is required when rejecting a listing.' },
        { status: 400 }
      );
    }

    if (newStatus === 'Correction Required' && !correctionInstructions && !reason) {
      return NextResponse.json(
        { success: false, error: 'Correction instructions are required when requesting listing edits.' },
        { status: 400 }
      );
    }

    const verificationStatus = (body.verificationStatus as ListingVerificationStatus) || undefined;
    const verificationBadgeExplanation = (body.verificationBadgeExplanation as string) || undefined;

    const result = updateListingStatus(
      id,
      newStatus,
      user.id,
      user.fullName || 'Land Officer',
      {
        reason,
        correctionInstructions,
        verificationStatus,
        verificationBadgeExplanation,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Listing status successfully updated to ${newStatus}.`,
      listing: result.listing,
    });
  } catch (error: any) {
    console.error('Error moderating listing:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal review error.' },
      { status: 500 }
    );
  }
}
