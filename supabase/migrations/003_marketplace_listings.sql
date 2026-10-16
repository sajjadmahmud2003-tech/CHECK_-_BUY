-- ==============================================================================
-- LANDCHECK AI — DATABASE SCHEMA MIGRATION 003
-- Buy & Sell Land Marketplace: Listings, Images, Interests & Moderation
-- ==============================================================================

-- 1. Land Listings Table
CREATE TABLE IF NOT EXISTS land_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_number TEXT UNIQUE NOT NULL,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seller_name TEXT NOT NULL,
    seller_phone TEXT NOT NULL,
    seller_email TEXT NOT NULL,
    show_phone BOOLEAN NOT NULL DEFAULT true,
    show_email BOOLEAN NOT NULL DEFAULT false,
    title TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK (property_type IN ('Agricultural', 'Residential', 'Commercial', 'Industrial', 'Other')),
    price_bdt NUMERIC(15, 2) NOT NULL CHECK (price_bdt > 0),
    is_negotiable BOOLEAN NOT NULL DEFAULT false,
    area_value NUMERIC(10, 2) NOT NULL CHECK (area_value > 0),
    area_unit TEXT NOT NULL CHECK (area_unit IN ('Decimal', 'Katha', 'Bigha', 'Acre')),
    district TEXT NOT NULL,
    upazila TEXT NOT NULL,
    mouza TEXT NOT NULL,
    location_description TEXT NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    description TEXT NOT NULL,
    road_access TEXT,
    utilities TEXT[] DEFAULT '{}',
    nearby_landmarks TEXT,
    khatian_no TEXT,
    dag_no TEXT,
    jl_number TEXT,
    cover_image TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending Review' CHECK (status IN ('Draft', 'Pending Review', 'Under Review', 'Correction Required', 'Published', 'Rejected', 'Sold', 'Closed')),
    verification_status TEXT NOT NULL DEFAULT 'Not Verified' CHECK (verification_status IN ('Not Verified', 'Preliminary Review', 'Officer Verified')),
    verification_badge_explanation TEXT,
    review_reason TEXT,
    correction_instructions TEXT,
    is_demo_data BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_land_listings_seller_id ON land_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_land_listings_status ON land_listings(status);
CREATE INDEX IF NOT EXISTS idx_land_listings_district ON land_listings(district);
CREATE INDEX IF NOT EXISTS idx_land_listings_property_type ON land_listings(property_type);
CREATE INDEX IF NOT EXISTS idx_land_listings_price_bdt ON land_listings(price_bdt);
CREATE INDEX IF NOT EXISTS idx_land_listings_created_at ON land_listings(created_at DESC);

-- 2. Listing Images Table
CREATE TABLE IF NOT EXISTS listing_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES land_listings(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    is_cover BOOLEAN NOT NULL DEFAULT false,
    caption TEXT,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);

-- 3. Listing Private Supporting Documents Table (Never exposed publicly)
CREATE TABLE IF NOT EXISTS listing_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES land_listings(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_docs_listing_id ON listing_documents(listing_id);

-- 4. Listing Buyer Interests Table
CREATE TABLE IF NOT EXISTS listing_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES land_listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Withdrawn', 'Contacted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_active_interest_per_buyer UNIQUE (listing_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_interests_listing_id ON listing_interests(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_interests_buyer_id ON listing_interests(buyer_id);

-- 5. Listing Review History (Audit Trail)
CREATE TABLE IF NOT EXISTS listing_review_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES land_listings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewer_name TEXT NOT NULL,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_review_history_listing_id ON listing_review_history(listing_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE land_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_review_history ENABLE ROW LEVEL SECURITY;

-- Land Listings RLS:
-- Anyone (including public visitors) can read Published listings
CREATE POLICY "Public can view published listings"
    ON land_listings FOR SELECT
    USING (status = 'Published');

-- Sellers can view all their own listings (even Draft, Pending Review, Rejected)
CREATE POLICY "Sellers can view own listings"
    ON land_listings FOR SELECT
    USING (auth.uid() = seller_id);

-- Officers and Admins can view all listings for moderation
CREATE POLICY "Officers and Admins can view all listings"
    ON land_listings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('officer', 'admin')
        )
    );

-- Authenticated sellers can create listings
CREATE POLICY "Authenticated users can create listings"
    ON land_listings FOR INSERT
    WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own listings (cannot self-publish or self-verify)
CREATE POLICY "Sellers can update own listings"
    ON land_listings FOR UPDATE
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

-- Officers and Admins can update any listing (e.g., status, verification)
CREATE POLICY "Officers and Admins can update listings"
    ON land_listings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('officer', 'admin')
        )
    );

-- Listing Documents RLS: Only seller and officers/admins can see supporting docs
CREATE POLICY "Seller and Officers can view listing documents"
    ON listing_documents FOR SELECT
    USING (
        auth.uid() = uploaded_by OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('officer', 'admin')
        )
    );

-- Listing Interests RLS:
-- Buyers can view their own interests
CREATE POLICY "Buyers can view own interests"
    ON listing_interests FOR SELECT
    USING (auth.uid() = buyer_id);

-- Sellers can view interests expressed on their listings
CREATE POLICY "Sellers can view interests on their listings"
    ON listing_interests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM land_listings
            WHERE land_listings.id = listing_interests.listing_id
            AND land_listings.seller_id = auth.uid()
        )
    );

-- Authenticated buyers can express interest
CREATE POLICY "Authenticated buyers can insert interest"
    ON listing_interests FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Buyers can update/withdraw their own interest
CREATE POLICY "Buyers can update own interest"
    ON listing_interests FOR UPDATE
    USING (auth.uid() = buyer_id);
