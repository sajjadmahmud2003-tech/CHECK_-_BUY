import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getListings, createListing } from '@/lib/data-store';
import { ListingStatus, ListingPropertyType, ListingAreaUnit } from '@/types';

/**
 * GET /api/marketplace/listings
 * Public browsing of Published listings or authenticated seller's My Listings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const myListings = searchParams.get('myListings') === 'true';

    // If requesting personal listings, require authentication
    let sellerId: string | undefined = undefined;
    if (myListings) {
      const user = await getAuthenticatedUser(request);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required to view your listings.' },
          { status: 401 }
        );
      }
      sellerId = user.id;
    }

    const district = searchParams.get('district') || undefined;
    const upazila = searchParams.get('upazila') || undefined;
    const propertyType = searchParams.get('propertyType') || undefined;
    const statusParam = searchParams.get('status') || undefined;
    const verificationStatus = searchParams.get('verificationStatus') || undefined;
    const query = searchParams.get('query') || searchParams.get('q') || undefined;
    const sortBy = (searchParams.get('sortBy') as any) || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const minArea = searchParams.get('minArea') ? parseFloat(searchParams.get('minArea')!) : undefined;
    const maxArea = searchParams.get('maxArea') ? parseFloat(searchParams.get('maxArea')!) : undefined;

    // For public buyers, only Published listings are returned unless seller is querying their own
    const effectiveStatus = myListings
      ? (statusParam as ListingStatus | 'all') || 'all'
      : 'Published';

    const result = getListings({
      status: effectiveStatus,
      sellerId,
      district,
      upazila,
      propertyType,
      verificationStatus,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      query,
      sortBy,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error fetching marketplace listings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch listings.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/listings
 * Authenticated seller creates a new land listing (Starts as Pending Review)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to post a land listing.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Required fields validation
    const title = (body.title || '').trim();
    const propertyType = body.propertyType as ListingPropertyType;
    const priceBdt = typeof body.priceBdt === 'number' ? body.priceBdt : parseFloat(body.priceBdt || '0');
    const areaValue = typeof body.areaValue === 'number' ? body.areaValue : parseFloat(body.areaValue || '0');
    const areaUnit = (body.areaUnit || 'Katha') as ListingAreaUnit;
    const district = (body.district || '').trim();
    const upazila = (body.upazila || '').trim();
    const mouza = (body.mouza || '').trim();
    const locationDescription = (body.locationDescription || '').trim();
    const description = (body.description || '').trim();

    if (!title || title.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Property title is required (minimum 5 characters).' },
        { status: 400 }
      );
    }

    const validPropertyTypes: ListingPropertyType[] = [
      'Agricultural',
      'Residential',
      'Commercial',
      'Industrial',
      'Other',
    ];
    if (!validPropertyTypes.includes(propertyType)) {
      return NextResponse.json(
        { success: false, error: 'Valid property type is required (Agricultural, Residential, Commercial, Industrial, or Other).' },
        { status: 400 }
      );
    }

    if (isNaN(priceBdt) || priceBdt <= 0) {
      return NextResponse.json(
        { success: false, error: 'Asking price in BDT must be a positive number.' },
        { status: 400 }
      );
    }

    if (isNaN(areaValue) || areaValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'Total land area must be a positive number.' },
        { status: 400 }
      );
    }

    const validAreaUnits: ListingAreaUnit[] = ['Decimal', 'Katha', 'Bigha', 'Acre'];
    if (!validAreaUnits.includes(areaUnit)) {
      return NextResponse.json(
        { success: false, error: 'Area unit must be Decimal, Katha, Bigha, or Acre.' },
        { status: 400 }
      );
    }

    if (!district || !upazila || !mouza) {
      return NextResponse.json(
        { success: false, error: 'District, Upazila, and Mouza are mandatory location fields.' },
        { status: 400 }
      );
    }

    if (!locationDescription || locationDescription.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Please provide a clear location description or address.' },
        { status: 400 }
      );
    }

    if (!description || description.length < 15) {
      return NextResponse.json(
        { success: false, error: 'Property description is required (minimum 15 characters).' },
        { status: 400 }
      );
    }

    // Seller contact preferences
    const sellerPhone = (body.sellerPhone || user.phone || '01700-000000').trim();
    const sellerEmail = user.email || 'seller@landcheck.gov.bd';
    const showPhone = body.showPhone !== false;
    const showEmail = Boolean(body.showEmail);

    // Optional fields
    const isNegotiable = Boolean(body.isNegotiable);
    const roadAccess = (body.roadAccess || '').trim() || undefined;
    const utilities = Array.isArray(body.utilities) ? body.utilities : [];
    const nearbyLandmarks = (body.nearbyLandmarks || '').trim() || undefined;
    const khatianNo = (body.khatianNo || '').trim() || undefined;
    const dagNo = (body.dagNo || '').trim() || undefined;
    const jlNumber = (body.jlNumber || '').trim() || undefined;
    const latitude = body.latitude ? parseFloat(body.latitude) : undefined;
    const longitude = body.longitude ? parseFloat(body.longitude) : undefined;

    // Photos
    const rawImages = Array.isArray(body.images) ? body.images : [];
    const imagesToSave = rawImages.map((img: any, idx: number) => ({
      storagePath: img.storagePath || img.url || '/images/properties/residential-plot.svg',
      isCover: Boolean(img.isCover || idx === 0),
      caption: img.caption || 'Property photograph',
    }));

    // Supporting private documents
    const rawDocs = Array.isArray(body.documents) ? body.documents : [];
    const docsToSave = rawDocs.map((doc: any) => ({
      fileName: doc.fileName || 'supporting_doc.pdf',
      storageKey: doc.storageKey || `doc-${Date.now()}`,
      fileType: doc.fileType || 'application/pdf',
      fileSize: doc.fileSize || 102400,
    }));

    // Choose default cover image if none uploaded
    const defaultCover =
      propertyType === 'Commercial'
        ? '/images/properties/commercial-land.svg'
        : propertyType === 'Agricultural'
        ? '/images/properties/agricultural-land.svg'
        : propertyType === 'Industrial'
        ? '/images/properties/industrial-plot.svg'
        : '/images/properties/residential-plot.svg';

    const newListing = createListing(
      {
        sellerId: user.id,
        sellerName: user.fullName || 'Citizen Seller',
        sellerPhone,
        sellerEmail,
        showPhone,
        showEmail,
        title,
        propertyType,
        priceBdt,
        isNegotiable,
        areaValue,
        areaUnit,
        district,
        upazila,
        mouza,
        locationDescription,
        latitude,
        longitude,
        description,
        roadAccess,
        utilities,
        nearbyLandmarks,
        khatianNo,
        dagNo,
        jlNumber,
        coverImage: imagesToSave[0]?.storagePath || defaultCover,
      },
      imagesToSave,
      docsToSave
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Land listing submitted successfully and queued for moderation review.',
        listing: newListing,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error submitting land listing:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while saving listing.' },
      { status: 500 }
    );
  }
}
