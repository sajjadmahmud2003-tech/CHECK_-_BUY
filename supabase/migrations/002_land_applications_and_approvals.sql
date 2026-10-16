-- ==============================================================================
-- LANDCHECK AI — DATABASE SCHEMA MIGRATION 002
-- Secure Land Document Application & Officer Approval System
-- ==============================================================================

-- 1. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number TEXT UNIQUE NOT NULL,
    citizen_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    citizen_name TEXT NOT NULL,
    citizen_phone TEXT NOT NULL,
    citizen_email TEXT,
    citizen_nid TEXT,
    district TEXT NOT NULL,
    upazila TEXT NOT NULL,
    mouza TEXT NOT NULL,
    jl_number TEXT,
    khatian_no TEXT NOT NULL,
    dag_no TEXT NOT NULL,
    ownership_relation TEXT NOT NULL DEFAULT 'Owner' CHECK (ownership_relation IN ('Owner', 'Heir / Legal Successor', 'Power of Attorney', 'Prospective Buyer / Due Diligence', 'Authorized Representative')),
    document_type TEXT NOT NULL CHECK (document_type IN ('khatian_copy', 'porcha_record', 'mutation_order', 'dcr_duplicate', 'certified_deed', 'land_clearance_certificate')),
    purpose TEXT NOT NULL,
    additional_info TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Draft', 'Pending', 'Under_Review', 'Correction_Required', 'Approved', 'Rejected', 'Document_Available')),
    officer_message TEXT,
    rejection_reason TEXT,
    correction_instructions TEXT,
    internal_notes TEXT,
    assigned_officer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_office TEXT NOT NULL DEFAULT 'AC Land Office & Sub-Registry Archive',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_applications_citizen_id ON applications(citizen_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_assigned_officer ON applications(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_applications_app_number ON applications(application_number);

-- 2. Application Attachments Table (Citizen uploaded supporting documents)
CREATE TABLE IF NOT EXISTS application_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_application_id ON application_attachments(application_id);

-- 3. Official Documents Table (Officer uploaded/certified final documents)
CREATE TABLE IF NOT EXISTS official_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_version INT NOT NULL DEFAULT 1,
    verification_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_official_documents_application ON official_documents(application_id);

-- 4. Application Status History Table
CREATE TABLE IF NOT EXISTS application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    changed_by_name TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_application ON application_status_history(application_id);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'action_required', 'rejection')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Applications: Citizens can view and create their own applications
CREATE POLICY "Citizens view own applications" ON applications
    FOR SELECT USING (
        auth.uid() = citizen_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('officer', 'admin'))
    );

CREATE POLICY "Citizens create own applications" ON applications
    FOR INSERT WITH CHECK (
        auth.uid() = citizen_id
    );

CREATE POLICY "Officers and Admins update applications" ON applications
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('officer', 'admin'))
    );

-- Attachments: Citizen or Officer can view
CREATE POLICY "View application attachments" ON application_attachments
    FOR SELECT USING (
        auth.uid() = uploaded_by OR 
        EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = application_attachments.application_id AND applications.citizen_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('officer', 'admin'))
    );

-- Official Documents: Citizens can ONLY view if status is Approved or Document_Available
CREATE POLICY "View official documents" ON official_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = official_documents.application_id 
            AND applications.citizen_id = auth.uid()
            AND applications.status IN ('Approved', 'Document_Available')
        ) OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('officer', 'admin'))
    );

CREATE POLICY "Officers insert official documents" ON official_documents
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('officer', 'admin'))
    );

-- Status History: Accessible to the application owner and officers
CREATE POLICY "View status history" ON application_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = application_status_history.application_id AND applications.citizen_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('officer', 'admin'))
    );

-- Notifications: Strict recipient ownership
CREATE POLICY "Users view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = recipient_id);
