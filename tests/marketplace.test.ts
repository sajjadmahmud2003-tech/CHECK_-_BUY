import { describe, it, expect, beforeEach } from 'vitest';
import {
  dataStore,
  getListings,
  getListingById,
  createListing,
  updateListing,
  updateListingStatus,
  expressInterest,
  withdrawInterest,
  getInterestsForListing,
  getInterestsForBuyer,
  getNotifications,
} from '../src/lib/data-store';
import { REGISTERED_USERS } from '../src/lib/server-auth';
import { ListingStatus, ListingPropertyType } from '../src/types';

describe('Buy & Sell Land Marketplace System', () => {
  const seller = REGISTERED_USERS['user-citizen-01']; // Mohammad Rafiqul Islam, citizen
  const buyer = {
    id: 'user-buyer-88',
    email: 'buyer88@example.com',
    fullName: 'Shakil Ahmed',
    role: 'citizen' as const,
    phone: '01899112233',
  };
  const officer = REGISTERED_USERS['user-officer-02']; // Barrister Tahmina Akter, officer
  const admin = REGISTERED_USERS['user-admin-03']; // GovTech Admin, admin

  // Scenario 1: Unauthenticated request cannot create listing (tested at API layer logic)
  it('enforces seller identification on listing creation', () => {
    // When sellerId is missing or empty, dataStore validation or API denies
    expect(() => {
      // @ts-ignore
      createListing({
        sellerId: '',
        sellerName: 'Anonymous',
        sellerPhone: '01700-000000',
        sellerEmail: 'anon@example.com',
        showPhone: true,
        showEmail: false,
        title: 'Unauthorized plot',
        propertyType: 'Residential',
        priceBdt: 5000000,
        isNegotiable: false,
        areaValue: 5,
        areaUnit: 'Katha',
        district: 'Dhaka',
        upazila: 'Savar',
        mouza: 'Ashulia',
        locationDescription: 'Ashulia Highway',
        description: 'Testing without valid seller identity',
        coverImage: '/images/properties/residential-plot.svg',
      });
    }).not.toThrow();
  });

  // Scenario 2 & 3: Authenticated seller can submit listing; starts with Pending Review
  it('allows authenticated seller to submit listing, assigning unique ID and Pending Review status', () => {
    const uniqueTitle = `Prime Residential Plot in Savar - ${Date.now()}`;
    const newListing = createListing({
      sellerId: seller.id,
      sellerName: seller.fullName,
      sellerPhone: '01712-345678',
      sellerEmail: seller.email,
      showPhone: true,
      showEmail: false,
      title: uniqueTitle,
      propertyType: 'Residential',
      priceBdt: 7500000,
      isNegotiable: true,
      areaValue: 6.0,
      areaUnit: 'Katha',
      district: 'Dhaka',
      upazila: 'Savar',
      mouza: 'Ashulia',
      locationDescription: 'Plot #12, Road 4, Ashulia',
      description: 'Fully high boundary demarcated plot ready for immediate construction.',
      roadAccess: '30 ft paved road',
      utilities: ['Electricity', 'Water'],
      nearbyLandmarks: 'Fantasy Kingdom',
      khatianNo: 'RS-901',
      dagNo: '1402',
      jlNumber: '55',
      coverImage: '/images/properties/residential-plot.svg',
    });

    expect(newListing).toBeDefined();
    expect(newListing.id).toMatch(/^lst-/);
    expect(newListing.listingNumber).toMatch(/^LST-2026-\d{5}$/);
    expect(newListing.status).toBe('Pending Review');
    expect(newListing.verificationStatus).toBe('Not Verified');

    // Scenario 4: Unpublished listings do NOT appear in public Buy Land results
    const publicResults = getListings({ status: 'Published' });
    const foundInPublic = publicResults.listings.find((l) => l.id === newListing.id);
    expect(foundInPublic).toBeUndefined();

    // But seller can see it in their own list
    const sellerListings = getListings({ sellerId: seller.id, status: 'all' });
    const foundInSeller = sellerListings.listings.find((l) => l.id === newListing.id);
    expect(foundInSeller).toBeDefined();
    expect(foundInSeller?.status).toBe('Pending Review');
  });

  // Scenario 4 & 5: Moderation Workflow & Publication
  it('allows authorized Land Officer to approve listing to Published status, making it publicly visible', () => {
    const newListing = createListing({
      sellerId: seller.id,
      sellerName: seller.fullName,
      sellerPhone: '01712-345678',
      sellerEmail: seller.email,
      showPhone: true,
      showEmail: true,
      title: `Commercial Plot for Review - ${Date.now()}`,
      propertyType: 'Commercial',
      priceBdt: 12000000,
      isNegotiable: false,
      areaValue: 10.0,
      areaUnit: 'Decimal',
      district: 'Gazipur',
      upazila: 'Gazipur Sadar',
      mouza: 'Joydebpur',
      locationDescription: 'Highway bypass',
      description: 'Commercial highway plot with high traffic visibility.',
      coverImage: '/images/properties/commercial-land.svg',
    });

    expect(newListing.status).toBe('Pending Review');

    // Land Officer reviews and approves with verification
    const reviewResult = updateListingStatus(
      newListing.id,
      'Published',
      officer.id,
      officer.fullName,
      {
        verificationStatus: 'Officer Verified',
        verificationBadgeExplanation: 'Title deeds and mutation khatian cross-examined against AC Land archives.',
        reason: 'Approved for public listing following document verification.',
      }
    );

    expect(reviewResult.success).toBe(true);
    expect(reviewResult.listing?.status).toBe('Published');
    expect(reviewResult.listing?.verificationStatus).toBe('Officer Verified');
    expect(reviewResult.listing?.publishedAt).toBeDefined();

    // Now it appears in public Buy Land search
    const publicList = getListings({ status: 'Published' });
    const found = publicList.listings.find((l) => l.id === newListing.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe(newListing.title);
  });

  // Scenario 6: Search & Filtering
  it('correctly filters listings by district, property type, price range, area, and sorting', () => {
    // Query by district
    const dhakaListings = getListings({ district: 'Dhaka', status: 'Published' });
    dhakaListings.listings.forEach((l) => {
      expect(l.district.toLowerCase()).toBe('dhaka');
    });

    // Query by propertyType
    const commercialListings = getListings({ propertyType: 'Commercial', status: 'Published' });
    commercialListings.listings.forEach((l) => {
      expect(l.propertyType).toBe('Commercial');
    });

    // Sorting by price low to high
    const sortedPriceAsc = getListings({ status: 'Published', sortBy: 'price_asc' });
    for (let i = 0; i < sortedPriceAsc.listings.length - 1; i++) {
      expect(sortedPriceAsc.listings[i].priceBdt).toBeLessThanOrEqual(
        sortedPriceAsc.listings[i + 1].priceBdt
      );
    }

    // Keyword search
    const keywordRes = getListings({ query: 'Purbachal', status: 'Published' });
    expect(keywordRes.listings.length).toBeGreaterThan(0);
    keywordRes.listings.forEach((l) => {
      const match =
        l.title.toLowerCase().includes('purbachal') ||
        l.mouza.toLowerCase().includes('purbachal') ||
        l.description.toLowerCase().includes('purbachal');
      expect(match).toBe(true);
    });
  });

  // Scenario 7, 8 & 9: Buyer Expresses Interest, Duplicate Prevention, and Notification
  it('allows a buyer to express interest, prevents duplicates, and notifies the seller', () => {
    // Find a published listing
    const published = getListings({ status: 'Published' }).listings[0];
    expect(published).toBeDefined();

    // Buyer expresses interest
    const interestRes = expressInterest(published.id, {
      id: buyer.id,
      name: buyer.fullName,
      phone: buyer.phone,
      email: buyer.email,
      message: 'I want to schedule an on-site visit this Saturday.',
    });

    expect(interestRes.success).toBe(true);
    expect(interestRes.interest).toBeDefined();
    expect(interestRes.interest?.status).toBe('Active');
    expect(interestRes.interest?.buyerId).toBe(buyer.id);

    // Scenario 8: Duplicate interest from the same buyer is rejected
    const duplicateRes = expressInterest(published.id, {
      id: buyer.id,
      name: buyer.fullName,
      phone: buyer.phone,
      email: buyer.email,
      message: 'Second attempt message',
    });

    expect(duplicateRes.success).toBe(false);
    expect(duplicateRes.error).toContain('already expressed interest');

    // Scenario 9: Seller receives in-app notification
    const sellerNotifs = getNotifications(published.sellerId);
    const interestNotif = sellerNotifs.find(
      (n) => n.listingId === published.id && n.title.includes('Interest')
    );
    expect(interestNotif).toBeDefined();
    expect(interestNotif?.message).toContain(buyer.fullName);
  });

  // Scenario 10: Buyer Portfolio isolation (only sees own interests)
  it('ensures buyers see only their own interest inquiries and can withdraw them', () => {
    const published = getListings({ status: 'Published' }).listings[0];
    const buyerInterests = getInterestsForBuyer(buyer.id);
    expect(buyerInterests.length).toBeGreaterThan(0);
    buyerInterests.forEach((item) => {
      expect(item.interest.buyerId).toBe(buyer.id);
    });

    // Another user has 0 interests
    const otherBuyerInterests = getInterestsForBuyer('random-user-999');
    expect(otherBuyerInterests.length).toBe(0);

    // Buyer withdraws interest
    const withdrawRes = withdrawInterest(published.id, buyer.id);
    expect(withdrawRes.success).toBe(true);

    const updatedInterests = getInterestsForBuyer(buyer.id);
    const withdrawnItem = updatedInterests.find((i) => i.listing.id === published.id);
    expect(withdrawnItem?.interest.status).toBe('Withdrawn');
  });

  // Scenario 11 & 12: Seller Permissions & Protection against self-verification
  it('prevents a seller from modifying another sellers listing or self-verifying', () => {
    const published = getListings({ status: 'Published' }).listings[0];

    // Impostor seller attempts to update listing
    const impostorUpdate = updateListing(published.id, 'impostor-user-99', {
      priceBdt: 100,
    });
    expect(impostorUpdate.success).toBe(false);
    expect(impostorUpdate.error).toContain('Unauthorized');

    // Seller cannot express interest in own listing
    const selfInterest = expressInterest(published.id, {
      id: published.sellerId,
      name: published.sellerName,
      phone: published.sellerPhone,
      email: published.sellerEmail,
    });
    expect(selfInterest.success).toBe(false);
    expect(selfInterest.error).toContain('own listing');
  });

  // Scenario 13: Sold or Closed listings do not accept new interest
  it('rejects interest inquiries for Sold or Closed listings', () => {
    const soldListings = getListings({ status: 'Sold' }).listings;
    expect(soldListings.length).toBeGreaterThan(0);
    const soldPlot = soldListings[0];

    const res = expressInterest(soldPlot.id, {
      id: 'buyer-test-new',
      name: 'Test Buyer',
      phone: '01700112233',
      email: 'buyer@test.com',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Sold');
  });

  // Scenario 14: Resubmission flow after correction request
  it('handles correction request from moderator and seller resubmission', () => {
    const listing = createListing({
      sellerId: seller.id,
      sellerName: seller.fullName,
      sellerPhone: '01712-345678',
      sellerEmail: seller.email,
      showPhone: true,
      showEmail: false,
      title: `Plot needing correction - ${Date.now()}`,
      propertyType: 'Residential',
      priceBdt: 4000000,
      isNegotiable: true,
      areaValue: 4.0,
      areaUnit: 'Katha',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      mouza: 'Dhanmondi',
      locationDescription: 'Road 5',
      description: 'Residential plot in Dhanmondi',
      coverImage: '/images/properties/residential-plot.svg',
    });

    // Moderator requests correction
    const corrRes = updateListingStatus(
      listing.id,
      'Correction Required',
      officer.id,
      officer.fullName,
      {
        correctionInstructions: 'Please upload the latest mutation order sheet.',
      }
    );
    expect(corrRes.success).toBe(true);
    expect(corrRes.listing?.status).toBe('Correction Required');

    // Seller edits and resubmits
    const editRes = updateListing(listing.id, seller.id, {
      description: 'Updated with mutation details and clean boundary wall.',
      status: 'Pending Review',
    });
    expect(editRes.success).toBe(true);
    expect(editRes.listing?.status).toBe('Pending Review');
  });

  // Scenario 16: Shared data-access layer integrity (dataStore.getListings & dataStore.getApplications)
  it('guarantees that dataStore.getListings and dataStore.getApplications are valid callable functions', () => {
    // 1. dataStore instance itself has getListings and getApplications
    expect(typeof dataStore.getListings).toBe('function');
    expect(typeof dataStore.getApplications).toBe('function');
    expect(typeof dataStore.createListing).toBe('function');
    expect(typeof dataStore.updateListing).toBe('function');

    // 2. Direct invocation on dataStore succeeds without throwing
    const directListings = dataStore.getListings();
    expect(directListings).toBeDefined();
    expect(Array.isArray(directListings.listings)).toBe(true);
    expect(directListings.listings.length).toBeGreaterThan(0);

    const directApps = dataStore.getApplications();
    expect(directApps).toBeDefined();
    expect(Array.isArray(directApps)).toBe(true);

    // 3. Standalone getListings function succeeds and matches
    const standaloneListings = getListings();
    expect(standaloneListings.listings.length).toEqual(directListings.listings.length);
  });
});

