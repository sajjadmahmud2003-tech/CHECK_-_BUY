-- ==============================================================================
-- LANDCHECK AI — FICTIONAL DEMO SEED DATA
-- Landtech Innovation Hackathon 2026
-- Notice: All personal names, plot numbers, and entities are completely simulated.
-- ==============================================================================

-- 1. Seed Demo Profiles
INSERT INTO profiles (id, email, full_name, role, phone, preferred_language)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'citizen@landcheck.gov.bd', 'Mohammad Rafiqul Islam', 'citizen', '+880 1712-345678', 'en'),
    ('22222222-2222-2222-2222-222222222222', 'officer@landcheck.gov.bd', 'Barrister Tahmina Akter', 'officer', '+880 1819-876543', 'bn'),
    ('33333333-3333-3333-3333-333333333333', 'admin@landcheck.gov.bd', 'Kazi Nazmul Huda', 'admin', '+880 1911-000000', 'en')
ON CONFLICT (email) DO NOTHING;

-- 2. Seed Clean Land Record (Dhanmondi Dag 405)
INSERT INTO land_records (id, division, division_bn, district, district_bn, upazila, upazila_bn, mouza, mouza_bn, jl_number, khatian_no, dag_no, land_class, land_class_bn, area_decimals, current_survey, has_caveat_or_dispute, source_provenance, is_demo_data)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Dhaka', 'ঢাকা',
    'Dhaka', 'ঢাকা',
    'Dhanmondi', 'ধানমন্ডি',
    'Dhanmondi Residential Area', 'ধানমন্ডি আবাসিক এলাকা',
    '214', '108', '405',
    'Homestead', 'বাস্তু (আবাসিক ভিটি)',
    12.50, 'BS', FALSE,
    'Simulated Settlement Archive', TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO ownership_records (land_record_id, owner_name, owner_name_bn, father_or_husband_name, share_portion, acquisition_type, recorded_date, nid_last_four)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Rafiqul Islam Chowdhury', 'রফিকুল ইসলাম চৌধুরী',
    'Late Nurul Islam Chowdhury', '1.00 (১৬ আনা)', 'Inheritance', '2012-05-14', '4821'
);

INSERT INTO mutation_records (land_record_id, case_no, mutation_khatian_no, applicant_name, status, approval_date, dcr_number, ac_land_office, holding_no, last_tax_paid_year, remarks)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'MUT-DHN-2012-984', '108/1', 'Rafiqul Islam Chowdhury', 'approved', '2012-08-20', 'DCR-849201',
    'Dhanmondi Circle AC Land, Dhaka', 'H-412/A', 2025, 'Complete inheritance chain verified.'
);

INSERT INTO survey_records (land_record_id, survey_type, year, khatian_no, dag_no, recorded_owner, area_decimals, verified_status)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CS', 1940, '45', '312', 'Kafiluddin Ahmed', 12.50, 'consistent'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SA', 1962, '72', '312', 'Nurul Islam Chowdhury', 12.50, 'consistent'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'RS', 1980, '95', '405', 'Nurul Islam Chowdhury', 12.50, 'consistent'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BS', 2010, '108', '405', 'Rafiqul Islam Chowdhury', 12.50, 'consistent');

-- 3. Seed Area Discrepancy Record (Gulshan Dag 1204)
INSERT INTO land_records (id, division, division_bn, district, district_bn, upazila, upazila_bn, mouza, mouza_bn, jl_number, khatian_no, dag_no, land_class, land_class_bn, area_decimals, current_survey, has_caveat_or_dispute, dispute_details, dispute_details_bn, source_provenance, is_demo_data)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Dhaka', 'ঢাকা',
    'Dhaka', 'ঢাকা',
    'Gulshan', 'গুলশান',
    'Gulshan Model Town', 'গুলশান মডেল টাউন',
    '118', '542', '1204',
    'Commercial / Residential', 'বাণিজ্যিক ও আবাসিক প্লট',
    16.80, 'BS', TRUE,
    'Area inflation discrepancy: 4.8 decimals added without registered title deed.',
    'জমির পরিমাণ বৃদ্ধিজনিত গড়মিল: আরএস জরিপে ১২ শতক থাকা সত্ত্বেও বিএস জরিপে ১৬.৮ শতক রেকর্ড হয়েছে।',
    'Simulated Settlement Archive', TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO mutation_records (land_record_id, case_no, mutation_khatian_no, applicant_name, status, approval_date, dcr_number, ac_land_office, holding_no, last_tax_paid_year, remarks)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'MUT-GLS-2017-310', '542/3', 'Shamsul Huda', 'inconsistent', '2017-04-10', 'DCR-631021',
    'Gulshan Circle AC Land, Dhaka', 'H-88/B', 2021, 'Holding tax assessment flagged pending boundary remeasurement.'
);

-- 4. Seed Dispute & Rejected Mutation Record (Uttara Dag 870)
INSERT INTO land_records (id, division, division_bn, district, district_bn, upazila, upazila_bn, mouza, mouza_bn, jl_number, khatian_no, dag_no, land_class, land_class_bn, area_decimals, current_survey, has_caveat_or_dispute, dispute_details, dispute_details_bn, source_provenance, is_demo_data)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Dhaka', 'ঢাকা',
    'Dhaka', 'ঢাকা',
    'Uttara', 'উত্তরা',
    'Bawnia', 'বাউনিয়া',
    '104', '319', '870',
    'Agricultural / Low Land', 'নাল জমি (ডোবা/নিম্নভূমি)',
    20.00, 'BS', TRUE,
    'Civil Title Suit pending at Assistant Judge Court. Conflicting deed claims.',
    'সহকারী জজ আদালতে স্বত্ব মোকদ্দমা চলমান। একই দাগে পরস্পরবিরোধী দলিল রেজিস্ট্রি হয়েছে।',
    'Simulated Settlement Archive', TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO mutation_records (land_record_id, case_no, mutation_khatian_no, applicant_name, status, ac_land_office, last_tax_paid_year, remarks)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'MUT-UTR-2021-502', 'Rejected', 'Mizanur Rahman Khan', 'rejected',
    'Uttara Circle AC Land, Dhaka', 2019, 'Application rejected due to pending civil court injunction.'
);
