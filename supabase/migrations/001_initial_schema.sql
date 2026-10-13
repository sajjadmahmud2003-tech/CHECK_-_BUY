-- ==============================================================================
-- LANDCHECK AI — DATABASE SCHEMA MIGRATION 001
-- Landtech Innovation Hackathon 2026 (Problem Statement P5: Check Before You Buy)
-- Normalized PostgreSQL Schema for Bangladesh Land Verification & Risk Screening
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'officer', 'admin')),
    phone TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'bn')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Land Records Table
CREATE TABLE IF NOT EXISTS land_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    division TEXT NOT NULL,
    division_bn TEXT NOT NULL,
    district TEXT NOT NULL,
    district_bn TEXT NOT NULL,
    upazila TEXT NOT NULL,
    upazila_bn TEXT NOT NULL,
    mouza TEXT NOT NULL,
    mouza_bn TEXT NOT NULL,
    jl_number TEXT NOT NULL,
    khatian_no TEXT NOT NULL,
    dag_no TEXT NOT NULL,
    land_class TEXT NOT NULL,
    land_class_bn TEXT NOT NULL,
    area_decimals NUMERIC(10, 2) NOT NULL,
    current_survey TEXT NOT NULL CHECK (current_survey IN ('CS', 'SA', 'RS', 'BS', 'City_Survey')),
    has_caveat_or_dispute BOOLEAN NOT NULL DEFAULT FALSE,
    dispute_details TEXT,
    dispute_details_bn TEXT,
    source_provenance TEXT NOT NULL DEFAULT 'Simulated Settlement Archive',
    is_verified_by_authority BOOLEAN NOT NULL DEFAULT FALSE,
    is_demo_data BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for high-performance citizen land searches
CREATE INDEX IF NOT EXISTS idx_land_records_district ON land_records(district);
CREATE INDEX IF NOT EXISTS idx_land_records_upazila ON land_records(upazila);
CREATE INDEX IF NOT EXISTS idx_land_records_mouza ON land_records(mouza);
CREATE INDEX IF NOT EXISTS idx_land_records_dag_khatian ON land_records(dag_no, khatian_no);

-- 3. Ownership Records Table
CREATE TABLE IF NOT EXISTS ownership_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    land_record_id UUID NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
    owner_name TEXT NOT NULL,
    owner_name_bn TEXT NOT NULL,
    father_or_husband_name TEXT NOT NULL,
    share_portion TEXT NOT NULL,
    acquisition_type TEXT NOT NULL CHECK (acquisition_type IN ('Inheritance', 'Purchase (Kabala)', 'Gift (Heba)', 'Allotment', 'Other')),
    recorded_date DATE NOT NULL,
    nid_last_four TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ownership_land_record_id ON ownership_records(land_record_id);

-- 4. Survey History Table (CS, SA, RS, BS continuity)
CREATE TABLE IF NOT EXISTS survey_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    land_record_id UUID NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
    survey_type TEXT NOT NULL CHECK (survey_type IN ('CS', 'SA', 'RS', 'BS', 'City_Survey')),
    year INT NOT NULL,
    khatian_no TEXT NOT NULL,
    dag_no TEXT NOT NULL,
    recorded_owner TEXT NOT NULL,
    area_decimals NUMERIC(10, 2) NOT NULL,
    land_class TEXT,
    verified_status TEXT NOT NULL DEFAULT 'consistent' CHECK (verified_status IN ('consistent', 'discrepancy', 'missing', 'verified')),
    remarks TEXT
);

CREATE INDEX IF NOT EXISTS idx_survey_land_record ON survey_records(land_record_id, survey_type);

-- 5. Mutation Records Table (খারিজ / নামজারি)
CREATE TABLE IF NOT EXISTS mutation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    land_record_id UUID UNIQUE NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
    case_no TEXT NOT NULL,
    mutation_khatian_no TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected', 'inconsistent')),
    approval_date DATE,
    dcr_number TEXT,
    ac_land_office TEXT NOT NULL,
    holding_no TEXT,
    last_tax_paid_year INT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Uploaded Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT NOT NULL,
    mime_type TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('deed', 'khatian', 'dcr', 'mutation_order', 'other')),
    raw_ocr_text TEXT,
    extracted_fields JSONB DEFAULT '{}'::JSONB,
    review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'reviewed', 'discrepancy_found', 'matched')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Verifications Table
CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_code TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    land_record_id UUID REFERENCES land_records(id) ON DELETE CASCADE,
    search_criteria JSONB DEFAULT '{}'::JSONB,
    overall_score INT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    overall_level TEXT NOT NULL CHECK (overall_level IN ('low', 'medium', 'high')),
    summary_en TEXT NOT NULL,
    summary_bn TEXT NOT NULL,
    ai_explanation_en TEXT,
    ai_explanation_bn TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Risk Findings Table
CREATE TABLE IF NOT EXISTS risk_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('ownership', 'area', 'mutation', 'historical_chain', 'legal_dispute', 'document_mismatch', 'tax_compliance')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    rule_code TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    reason_en TEXT NOT NULL,
    reason_bn TEXT NOT NULL,
    evidence TEXT NOT NULL,
    evidence_bn TEXT NOT NULL,
    recommended_steps_en TEXT NOT NULL,
    recommended_steps_bn TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_findings_verification ON risk_findings(verification_id);

-- 9. Generated Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    report_no TEXT UNIQUE NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Land records are viewable by all citizens for public screening
CREATE POLICY "Public read for land records" ON land_records
    FOR SELECT USING (true);

-- Users can read and manage only their own documents
CREATE POLICY "Users view their own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verifications can be viewed by anyone with the verification code or creator
CREATE POLICY "Public view verifications by code" ON verifications
    FOR SELECT USING (true);

-- Audit logs are viewable only by admins
CREATE POLICY "Admins view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
