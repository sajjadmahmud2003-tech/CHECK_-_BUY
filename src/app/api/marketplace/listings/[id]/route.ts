import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getListingById, updateListing } from '@/lib/data-store';

/**
 * GET /api/marketplace/listings/[id]
 * Fetch single land listing details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const listing = getListingById(id);

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Land listing not found.' },
        { status: 404 }
      );
    }

    // If listing is NOT published, only owner or officer/admin can view it
    if (listing.status !== 'Published') {
      const user = await getAuthenticatedUser(request);
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: `This listing is currently ${listing.status} and not publicly accessible.`,
          },
          { status: 403 }
        );
      }

      const isOwner = user.id === listing.sellerId;
      const isPrivileged = user.role === 'officer' || user.role === 'admin';

      if (!isOwner && !isPrivileged) {
        return NextResponse.json(
          {
            success: false,
            error: `Unauthorized: This listing is currently ${listing.status}.`,
          },
          { status: 403 }
        );
      }
    }

    // For public visitors (or buyers who are not the owner/officer), sanitize private documents and contact info
    const user = await getAuthenticatedUser(request);
    const isOwnerOrPrivileged =
      user && (user.id === listing.sellerId || user.role === 'officer' || user.role === 'admin');

    const sanitizedListing = {
      ...listing,
      documents: isOwnerOrPrivileged ? listing.documents : [],
      sellerPhone: isOwnerOrPrivileged || listing.showPhone ? listing.sellerPhone : undefined,
      sellerEmail: isOwnerOrPrivileged || listing.showEmail ? listing.sellerEmail : undefined,
    };

    return NextResponse.json({
      success: true,
      listing: sanitizedListing,
    });
  } catch (error: any) {
    console.error('Error fetching listing details:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve listing.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/marketplace/listings/[id]
 * Update land listing (Seller only)
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to edit listing.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const result = updateListing(id, user.id, body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Listing updated successfully.',
      listing: result.listing,
    });
  } catch (error: any) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update listing.' },
      { status: 500 }
    );
  }
}
