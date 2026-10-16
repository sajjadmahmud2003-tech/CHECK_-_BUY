import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getInterestsForBuyer, getInterestsForListing } from '@/lib/data-store';

/**
 * GET /api/marketplace/interests
 * Fetch buyer's expressed interests or seller's received inquiries
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view interests.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const role = searchParams.get('role'); // 'seller' or 'buyer'

    if (role === 'seller' && listingId) {
      const interests = getInterestsForListing(listingId, user.id);
      return NextResponse.json({
        success: true,
        interests,
      });
    }

    // Default: Return buyer's own expressed interests
    const myInterests = getInterestsForBuyer(user.id);
    return NextResponse.json({
      success: true,
      interests: myInterests,
    });
  } catch (error: any) {
    console.error('Error fetching interests:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve interests.' },
      { status: 500 }
    );
  }
}
