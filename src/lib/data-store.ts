import {
  LandRecord,
  VerificationResult,
  DocumentRecord,
  AuditLog,
  SearchFilters,
  LandApplication,
  ApplicationAttachment,
  OfficialDocumentRecord,
  ApplicationStatusHistory,
  InAppNotification,
  ApplicationStatus,
  LandListing,
  LandListingImage,
  LandListingDocument,
  LandListingInterest,
  ListingReviewHistory,
  ListingStatus,
  ListingPropertyType,
  ListingAreaUnit,
  ListingVerificationStatus,
} from '@/types';
import { MOCK_LAND_RECORDS } from './mock-data';
import { analyzeLandRecordRisks } from './risk-engine';

const INITIAL_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'doc-dhanmondi-khatian-405',
    userId: 'user-officer-02',
    fileName: 'RS_Khatian_405_Dhanmondi.pdf',
    fileUrl: '/api/documents/doc-dhanmondi-khatian-405/download',
    fileSize: 350208,
    mimeType: 'application/pdf',
    documentType: 'khatian',
    extractedFields: {
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      mouza: 'Dhanmondi Residential Area',
      dagNo: '405',
      khatianNo: '95',
      areaDecimals: 12.5,
      ownerNames: ['Nurul Islam Chowdhury'],
      confidenceScore: 0.95,
      fieldConfidence: { dagNo: 0.95, khatianNo: 0.95, areaDecimals: 0.92, ownerNames: 0.95 },
    },
    reviewStatus: 'reviewed',
    createdAt: '2026-02-15T11:00:00Z',
  },
  {
    id: 'doc-gulshan-deed-1204',
    userId: 'user-officer-02',
    fileName: 'SubRegistry_Deed_1204_Gulshan.pdf',
    fileUrl: '/api/documents/doc-gulshan-deed-1204/download',
    fileSize: 532480,
    mimeType: 'application/pdf',
    documentType: 'deed',
    extractedFields: {
      district: 'Dhaka',
      upazila: 'Gulshan',
      mouza: 'Gulshan Model Town',
      dagNo: '1204',
      khatianNo: '542',
      areaDecimals: 16.8,
      ownerNames: ['Shamsul Huda'],
      confidenceScore: 0.92,
      fieldConfidence: { dagNo: 0.92, khatianNo: 0.9, areaDecimals: 0.94, ownerNames: 0.9 },
    },
    reviewStatus: 'reviewed',
    createdAt: '2026-03-01T09:30:00Z',
  },
  {
    id: 'doc-mohammadpur-mutation-204',
    userId: 'user-officer-02',
    fileName: 'Mutation_Order_204_Mohammadpur.pdf',
    fileUrl: '/api/documents/doc-mohammadpur-mutation-204/download',
    fileSize: 286720,
    mimeType: 'application/pdf',
    documentType: 'mutation_order',
    extractedFields: {
      district: 'Dhaka',
      upazila: 'Mohammadpur',
      mouza: 'Jafrabad',
      dagNo: '512',
      khatianNo: '204',
      areaDecimals: 8.5,
      ownerNames: ['Habibur Rahman'],
      confidenceScore: 0.89,
      fieldConfidence: { dagNo: 0.9, khatianNo: 0.88, areaDecimals: 0.91, ownerNames: 0.88 },
    },
    reviewStatus: 'matched',
    createdAt: '2026-03-20T14:15:00Z',
  },
];

const INITIAL_APPLICATIONS: LandApplication[] = [
  {
    id: 'app-dhanmondi-10492',
    applicationNumber: 'APP-2026-10492',
    citizenId: 'user-citizen-01',
    citizenName: 'Mohammad Rafiqul Islam (Citizen Buyer)',
    citizenPhone: '+880 1712-345678',
    citizenEmail: 'citizen@landcheck.gov.bd',
    citizenNid: '19872691234567890',
    district: 'Dhaka',
    upazila: 'Dhanmondi',
    mouza: 'Dhanmondi Residential Area',
    jlNumber: '102',
    khatianNo: '95',
    dagNo: '405',
    ownershipRelation: 'Prospective Buyer / Due Diligence',
    documentType: 'khatian_copy',
    purpose: 'Pre-purchase due diligence and title verification before deed execution.',
    additionalInfo: 'Seller claims clean title under RS Survey 405. Requesting certified AC Land extract.',
    status: 'Document_Available',
    officerMessage: 'Record verified against Ministry of Land Digital Archives. Certified copy generated and signed.',
    assignedOfficerId: 'user-officer-02',
    assignedOffice: 'AC Land Office & Sub-Registry Archive, Dhanmondi',
    submittedAt: '2026-03-25T10:00:00Z',
    updatedAt: '2026-03-26T14:30:00Z',
    approvedAt: '2026-03-26T14:30:00Z',
    attachments: [
      {
        id: 'att-101',
        applicationId: 'app-dhanmondi-10492',
        uploadedBy: 'user-citizen-01',
        fileName: 'Buyer_NID_Copy.pdf',
        storageKey: 'att-101-Buyer_NID_Copy.pdf',
        fileType: 'application/pdf',
        fileSize: 245000,
        createdAt: '2026-03-25T10:00:00Z',
      },
    ],
    officialDocument: {
      id: 'off-doc-10492',
      applicationId: 'app-dhanmondi-10492',
      storageKey: 'RS_Khatian_405_Dhanmondi.pdf',
      fileName: 'Certified_RS_Khatian_405_Dhanmondi.pdf',
      fileSize: 350208,
      uploadedBy: 'user-officer-02',
      uploaderName: 'Barrister Tahmina Akter (Land Law Consultant)',
      documentVersion: 1,
      verificationHash: 'BD-GOV-ACLAND-DHANMONDI-405-CERTIFIED',
      isActive: true,
      uploadedAt: '2026-03-26T14:30:00Z',
    },
    statusHistory: [
      {
        id: 'hist-1',
        applicationId: 'app-dhanmondi-10492',
        oldStatus: 'Draft',
        newStatus: 'Pending',
        changedBy: 'user-citizen-01',
        changedByName: 'Mohammad Rafiqul Islam',
        reason: 'Application submitted by citizen',
        createdAt: '2026-03-25T10:00:00Z',
      },
      {
        id: 'hist-2',
        applicationId: 'app-dhanmondi-10492',
        oldStatus: 'Pending',
        newStatus: 'Under_Review',
        changedBy: 'user-officer-02',
        changedByName: 'Barrister Tahmina Akter (Land Officer)',
        reason: 'Officer started verification against AC Land ledger',
        createdAt: '2026-03-25T15:20:00Z',
      },
      {
        id: 'hist-3',
        applicationId: 'app-dhanmondi-10492',
        oldStatus: 'Under_Review',
        newStatus: 'Approved',
        changedBy: 'user-officer-02',
        changedByName: 'Barrister Tahmina Akter (Land Officer)',
        reason: 'All surveys and mutation status matched successfully.',
        createdAt: '2026-03-26T14:30:00Z',
      },
      {
        id: 'hist-4',
        applicationId: 'app-dhanmondi-10492',
        oldStatus: 'Approved',
        newStatus: 'Document_Available',
        changedBy: 'user-officer-02',
        changedByName: 'Barrister Tahmina Akter (Land Officer)',
        reason: 'Certified official PDF document uploaded and released for download.',
        createdAt: '2026-03-26T14:30:00Z',
      },
    ],
  },
  {
    id: 'app-gulshan-21840',
    applicationNumber: 'APP-2026-21840',
    citizenId: 'user-citizen-01',
    citizenName: 'Mohammad Rafiqul Islam (Citizen Buyer)',
    citizenPhone: '+880 1712-345678',
    citizenEmail: 'citizen@landcheck.gov.bd',
    district: 'Dhaka',
    upazila: 'Gulshan',
    mouza: 'Gulshan Model Town',
    khatianNo: '542',
    dagNo: '1204',
    ownershipRelation: 'Prospective Buyer / Due Diligence',
    documentType: 'mutation_order',
    purpose: 'Verify mutation order veracity regarding area reduction.',
    status: 'Under_Review',
    officerMessage: 'Inspection in progress at AC Land Gulshan Circle.',
    assignedOfficerId: 'user-officer-02',
    assignedOffice: 'AC Land Circle Office, Gulshan',
    submittedAt: '2026-04-01T09:15:00Z',
    updatedAt: '2026-04-02T11:00:00Z',
    attachments: [],
    statusHistory: [
      {
        id: 'hist-201',
        applicationId: 'app-gulshan-21840',
        oldStatus: 'Draft',
        newStatus: 'Pending',
        changedBy: 'user-citizen-01',
        changedByName: 'Mohammad Rafiqul Islam',
        reason: 'Application submitted',
        createdAt: '2026-04-01T09:15:00Z',
      },
      {
        id: 'hist-202',
        applicationId: 'app-gulshan-21840',
        oldStatus: 'Pending',
        newStatus: 'Under_Review',
        changedBy: 'user-officer-02',
        changedByName: 'Barrister Tahmina Akter (Land Officer)',
        reason: 'Checking cross-record discrepancies',
        createdAt: '2026-04-02T11:00:00Z',
      },
    ],
  },
  {
    id: 'app-uttara-34015',
    applicationNumber: 'APP-2026-34015',
    citizenId: 'user-citizen-01',
    citizenName: 'Mohammad Rafiqul Islam (Citizen Buyer)',
    citizenPhone: '+880 1712-345678',
    citizenEmail: 'citizen@landcheck.gov.bd',
    district: 'Dhaka',
    upazila: 'Uttara',
    mouza: 'Uttara Model Town',
    khatianNo: '310',
    dagNo: '870',
    ownershipRelation: 'Owner',
    documentType: 'certified_deed',
    purpose: 'Duplicate certified copy of deed for inheritance documentation.',
    status: 'Correction_Required',
    officerMessage: 'Please upload scanned copy of Death Certificate of previous title holder.',
    correctionInstructions: 'Submit Succession Certificate or Death Certificate issued by City Corporation.',
    assignedOfficerId: 'user-officer-02',
    assignedOffice: 'AC Land Office & Sub-Registry Archive, Uttara',
    submittedAt: '2026-04-05T08:00:00Z',
    updatedAt: '2026-04-06T16:00:00Z',
    attachments: [],
    statusHistory: [
      {
        id: 'hist-301',
        applicationId: 'app-uttara-34015',
        oldStatus: 'Draft',
        newStatus: 'Pending',
        changedBy: 'user-citizen-01',
        changedByName: 'Mohammad Rafiqul Islam',
        reason: 'Application submitted',
        createdAt: '2026-04-05T08:00:00Z',
      },
      {
        id: 'hist-302',
        applicationId: 'app-uttara-34015',
        oldStatus: 'Pending',
        newStatus: 'Correction_Required',
        changedBy: 'user-officer-02',
        changedByName: 'Barrister Tahmina Akter (Land Officer)',
        reason: 'Missing succession certificate',
        createdAt: '2026-04-06T16:00:00Z',
      },
    ],
  },
];

const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-1',
    recipientId: 'user-citizen-01',
    applicationId: 'app-dhanmondi-10492',
    title: 'Document Ready for Download',
    message: 'Your certified Khatian copy for Dhanmondi Dag #405 has been approved and is available for secure download.',
    type: 'success',
    isRead: false,
    createdAt: '2026-03-26T14:30:00Z',
  },
  {
    id: 'notif-2',
    recipientId: 'user-citizen-01',
    applicationId: 'app-uttara-34015',
    title: 'Correction Required on Application',
    message: 'Land Officer requested: Submit Succession Certificate or Death Certificate issued by City Corporation.',
    type: 'action_required',
    isRead: false,
    createdAt: '2026-04-06T16:00:00Z',
  },
  {
    id: 'notif-3',
    recipientId: 'user-officer-02',
    applicationId: 'app-gulshan-21840',
    title: 'New Land Document Application',
    message: 'New application APP-2026-21840 (Gulshan Dag #1204) awaiting review.',
    type: 'info',
    isRead: false,
    createdAt: '2026-04-01T09:15:00Z',
  },
];

const INITIAL_LISTINGS: LandListing[] = [
  {
    id: 'lst-purbachal-201',
    listingNumber: 'LST-2026-10492',
    sellerId: 'user-citizen-01',
    sellerName: 'Mohammad Rafiqul Islam',
    sellerPhone: '01712-345678',
    sellerEmail: 'citizen@landcheck.gov.bd',
    showPhone: true,
    showEmail: false,
    title: 'Prime 5 Katha South-Facing Residential Plot in Purbachal Sector 21',
    propertyType: 'Residential',
    priceBdt: 6500000,
    isNegotiable: true,
    areaValue: 5.0,
    areaUnit: 'Katha',
    district: 'Dhaka',
    upazila: 'Rupganj',
    mouza: 'Purbachal Model Town',
    locationDescription: 'Sector 21, Road 302, Plot #14, near Central Lake and Commercial Zone.',
    latitude: 23.8342,
    longitude: 90.5218,
    description: 'High boundary wall demarcated residential plot in prime Sector 21 of Purbachal. 100% ready for building construction with soil test and clean registry papers. South facing, unobstructed air circulation.',
    roadAccess: '40 ft wide paved avenue directly connecting to 300 Feet Expressway.',
    utilities: ['Electricity', 'Deep Tube-well Water', 'Planned Underground Drainage'],
    nearbyLandmarks: 'Lake Park, Purbachal Central Club, Sector 21 Jame Masjid',
    khatianNo: 'RS-418',
    dagNo: '782',
    jlNumber: '88',
    coverImage: '/images/properties/residential-plot.svg',
    images: [
      {
        id: 'img-101',
        listingId: 'lst-purbachal-201',
        storagePath: '/images/properties/residential-plot.svg',
        isCover: true,
        caption: 'South-facing front boundary and demarcated corner pillars',
        createdAt: '2026-03-20T10:00:00Z',
      },
    ],
    documents: [],
    status: 'Published',
    verificationStatus: 'Preliminary Review',
    verificationBadgeExplanation: 'Preliminary boundary inspection completed against RAJUK master layout. CS & RS lineage verified clean.',
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-03-21T14:00:00Z',
    publishedAt: '2026-03-21T14:00:00Z',
    isDemoData: true,
  },
  {
    id: 'lst-savar-202',
    listingNumber: 'LST-2026-21840',
    sellerId: 'user-citizen-01',
    sellerName: 'Mohammad Rafiqul Islam',
    sellerPhone: '01712-345678',
    sellerEmail: 'citizen@landcheck.gov.bd',
    showPhone: true,
    showEmail: true,
    title: '12 Decimal Commercial Highway Facing Land in Ashulia Near DEPZ',
    propertyType: 'Commercial',
    priceBdt: 14000000,
    isNegotiable: false,
    areaValue: 12.0,
    areaUnit: 'Decimal',
    district: 'Dhaka',
    upazila: 'Savar',
    mouza: 'Ashulia',
    locationDescription: 'Directly on Baipail-Abdullahpur Highway, 500 meters from DEPZ Gate 2.',
    latitude: 23.9482,
    longitude: 90.2815,
    description: 'High-visibility commercial land suitable for commercial complex, bank branch, showroom, or warehouse setup. Complete gas line, industrial electric substation access, and clean title registry.',
    roadAccess: '60 ft Highway frontage with heavy vehicle turning clearance.',
    utilities: ['Electricity (3-phase 50kVA)', 'Titas Gas Pipeline', 'Deep Tube-well'],
    nearbyLandmarks: 'DEPZ Main Gate, Ashulia Thana, Fantasy Kingdom Crossing',
    khatianNo: 'RS-95',
    dagNo: '405',
    jlNumber: '102',
    coverImage: '/images/properties/commercial-land.svg',
    images: [
      {
        id: 'img-201',
        listingId: 'lst-savar-202',
        storagePath: '/images/properties/commercial-land.svg',
        isCover: true,
        caption: 'Highway frontage commercial elevation',
        createdAt: '2026-03-22T11:00:00Z',
      },
    ],
    documents: [],
    status: 'Published',
    verificationStatus: 'Officer Verified',
    verificationBadgeExplanation: 'Certified by Savar Upazila AC Land Office. Mutation Khatian #95 verified with DCR and zero tax arrears.',
    createdAt: '2026-03-22T11:00:00Z',
    updatedAt: '2026-03-23T16:00:00Z',
    publishedAt: '2026-03-23T16:00:00Z',
    isDemoData: true,
  },
  {
    id: 'lst-gazipur-203',
    listingNumber: 'LST-2026-33912',
    sellerId: 'user-citizen-01',
    sellerName: 'Mohammad Rafiqul Islam',
    sellerPhone: '01712-345678',
    sellerEmail: 'citizen@landcheck.gov.bd',
    showPhone: true,
    showEmail: false,
    title: '25 Decimal High Agricultural & Agro-Farming Land in Gazipur Sadar',
    propertyType: 'Agricultural',
    priceBdt: 3750000,
    isNegotiable: true,
    areaValue: 25.0,
    areaUnit: 'Decimal',
    district: 'Gazipur',
    upazila: 'Gazipur Sadar',
    mouza: 'Joydebpur',
    locationDescription: 'Vill: Baimile, Near Joydebpur Agricultural Research Zone.',
    latitude: 23.9984,
    longitude: 90.4203,
    description: 'High fertility organic agro land with continuous freshwater canal irrigation. Ideal for dairy farm, fruit orchard, or poultry project. Absolutely non-flooding high soil profile.',
    roadAccess: '16 ft paved rural union parishad road connected to Joydebpur-Mymensingh link.',
    utilities: ['Electricity', 'Freshwater Canal Irrigation'],
    nearbyLandmarks: 'Bari Agricultural Institute, Joydebpur Rail Junction',
    khatianNo: 'SA-210',
    dagNo: '654',
    jlNumber: '45',
    coverImage: '/images/properties/agricultural-land.svg',
    images: [
      {
        id: 'img-301',
        listingId: 'lst-gazipur-203',
        storagePath: '/images/properties/agricultural-land.svg',
        isCover: true,
        caption: 'Fertile crop field and perimeter irrigation channel',
        createdAt: '2026-03-24T09:30:00Z',
      },
    ],
    documents: [],
    status: 'Published',
    verificationStatus: 'Not Verified',
    verificationBadgeExplanation: 'Internal seller listing. Government Land Office verification has not been requested yet.',
    createdAt: '2026-03-24T09:30:00Z',
    updatedAt: '2026-03-25T12:00:00Z',
    publishedAt: '2026-03-25T12:00:00Z',
    isDemoData: true,
  },
  {
    id: 'lst-narayanganj-204',
    listingNumber: 'LST-2026-44820',
    sellerId: 'user-citizen-01',
    sellerName: 'Mohammad Rafiqul Islam',
    sellerPhone: '01712-345678',
    sellerEmail: 'citizen@landcheck.gov.bd',
    showPhone: true,
    showEmail: true,
    title: '1.5 Bigha Heavy Industrial Setup Land in Sonargaon Economic Corridor',
    propertyType: 'Industrial',
    priceBdt: 32000000,
    isNegotiable: true,
    areaValue: 1.5,
    areaUnit: 'Bigha',
    district: 'Narayanganj',
    upazila: 'Sonargaon',
    mouza: 'Meghnaghat',
    locationDescription: 'Meghnaghat Industrial Zone, near Dhaka-Chittagong Highway.',
    latitude: 23.6015,
    longitude: 90.6124,
    description: 'Fully reinforced sand-compacted industrial setup plot. Ready for heavy manufacturing factory, logistics hub, or container depot. High tension electricity line and direct river cargo access within 1 km.',
    roadAccess: '80 ft dedicated container carrier roadway.',
    utilities: ['High Voltage Power (11kV)', 'Industrial Gas Connection', 'Water Reservoir'],
    nearbyLandmarks: 'Meghna Toll Plaza, Sonargaon Museum Junction',
    khatianNo: 'RS-542',
    dagNo: '1204',
    jlNumber: '67',
    coverImage: '/images/properties/industrial-plot.svg',
    images: [
      {
        id: 'img-401',
        listingId: 'lst-narayanganj-204',
        storagePath: '/images/properties/industrial-plot.svg',
        isCover: true,
        caption: 'Heavy industrial boundary and access corridor',
        createdAt: '2026-03-25T14:00:00Z',
      },
    ],
    documents: [],
    status: 'Published',
    verificationStatus: 'Officer Verified',
    verificationBadgeExplanation: 'Sub-Registry deed #1204 and AC Land mutation verified without legal disputes or caveats.',
    createdAt: '2026-03-25T14:00:00Z',
    updatedAt: '2026-03-26T17:00:00Z',
    publishedAt: '2026-03-26T17:00:00Z',
    isDemoData: true,
  },
  {
    id: 'lst-dhanmondi-205',
    listingNumber: 'LST-2026-55910',
    sellerId: 'user-citizen-01',
    sellerName: 'Mohammad Rafiqul Islam',
    sellerPhone: '01712-345678',
    sellerEmail: 'citizen@landcheck.gov.bd',
    showPhone: false,
    showEmail: false,
    title: '3.5 Katha Corner Residential Plot in Dhanmondi R/A (SOLD)',
    propertyType: 'Residential',
    priceBdt: 42000000,
    isNegotiable: false,
    areaValue: 3.5,
    areaUnit: 'Katha',
    district: 'Dhaka',
    upazila: 'Dhanmondi',
    mouza: 'Dhanmondi Residential Area',
    locationDescription: 'Road 9/A, Dhanmondi, Dhaka.',
    description: 'Elite corner residential plot. Sold and registered successfully.',
    coverImage: '/images/properties/residential-plot.svg',
    images: [],
    documents: [],
    status: 'Sold',
    verificationStatus: 'Officer Verified',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-28T15:00:00Z',
    isDemoData: true,
  },
  {
    id: 'lst-pending-206',
    listingNumber: 'LST-2026-66720',
    sellerId: 'user-citizen-01',
    sellerName: 'Mohammad Rafiqul Islam',
    sellerPhone: '01712-345678',
    sellerEmail: 'citizen@landcheck.gov.bd',
    showPhone: true,
    showEmail: false,
    title: '8 Decimal Residential Plot near Uttara Sector 18 (Metro Rail Station)',
    propertyType: 'Residential',
    priceBdt: 19500000,
    isNegotiable: true,
    areaValue: 8.0,
    areaUnit: 'Decimal',
    district: 'Dhaka',
    upazila: 'Uttara',
    mouza: 'Baunia',
    locationDescription: 'Sector 18 Extension, adjacent to Diabari Metro Depot.',
    description: 'Freshly submitted residential listing awaiting moderation inspection. Excellent location 4 mins from Uttara North Station.',
    roadAccess: '30 ft connecting road',
    utilities: ['Electricity', 'Water'],
    coverImage: '/images/properties/residential-plot.svg',
    images: [],
    documents: [],
    status: 'Pending Review',
    verificationStatus: 'Not Verified',
    createdAt: '2026-04-10T08:00:00Z',
    updatedAt: '2026-04-10T08:00:00Z',
    isDemoData: true,
  },
];

class DataStore {
  private records: LandRecord[] = [...MOCK_LAND_RECORDS];
  private verifications: VerificationResult[] = [];
  private documents: DocumentRecord[] = [...INITIAL_DOCUMENTS];
  private applications: LandApplication[] = [...INITIAL_APPLICATIONS];
  private notifications: InAppNotification[] = [...INITIAL_NOTIFICATIONS];
  private listings: LandListing[] = [...INITIAL_LISTINGS];
  private listingInterests: LandListingInterest[] = [];
  private listingReviewHistory: ListingReviewHistory[] = [];
  private auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      action: 'SYSTEM_BOOT',
      resourceType: 'system',
      details: 'CHECK_&_BUY initialized with simulated survey archives.',
      timestamp: new Date().toISOString(),
      userEmail: 'system@landcheck.gov.bd'
    }
  ];

  constructor() {
    // Generate initial verifications for demo records
    this.records.forEach(r => {
      const v = analyzeLandRecordRisks(r);
      this.verifications.push(v);
    });

    // Explicitly bind all methods to instance
    this.getApplications = this.getApplications.bind(this);
    this.getApplicationById = this.getApplicationById.bind(this);
    this.getApplicationByNumber = this.getApplicationByNumber.bind(this);
    this.createApplication = this.createApplication.bind(this);
    this.updateApplicationStatus = this.updateApplicationStatus.bind(this);
    this.uploadOfficialDocument = this.uploadOfficialDocument.bind(this);
    this.addApplicationAttachment = this.addApplicationAttachment.bind(this);
    this.getNotifications = this.getNotifications.bind(this);
    this.createNotification = this.createNotification.bind(this);
    this.markNotificationAsRead = this.markNotificationAsRead.bind(this);
    this.markAllNotificationsAsRead = this.markAllNotificationsAsRead.bind(this);
    this.getRecords = this.getRecords.bind(this);
    this.getRecordById = this.getRecordById.bind(this);
    this.getVerifications = this.getVerifications.bind(this);
    this.getDocuments = this.getDocuments.bind(this);
    this.getListings = this.getListings.bind(this);
    this.getListingById = this.getListingById.bind(this);
    this.getListingByNumber = this.getListingByNumber.bind(this);
    this.createListing = this.createListing.bind(this);
    this.updateListing = this.updateListing.bind(this);
    this.updateListingStatus = this.updateListingStatus.bind(this);
    this.expressInterest = this.expressInterest.bind(this);
    this.withdrawInterest = this.withdrawInterest.bind(this);
    this.getInterestsForListing = this.getInterestsForListing.bind(this);
    this.getInterestsForBuyer = this.getInterestsForBuyer.bind(this);
    this.getReviewHistoryForListing = this.getReviewHistoryForListing.bind(this);
  }

  // --- Land Records ---
  getRecords(filters?: SearchFilters): LandRecord[] {
    let result = [...this.records];

    if (!filters) return result;

    if (filters.district && filters.district !== 'all') {
      result = result.filter(r => 
        r.district.toLowerCase() === filters.district?.toLowerCase() ||
        r.districtBn === filters.district
      );
    }

    if (filters.upazila && filters.upazila !== 'all') {
      result = result.filter(r => 
        r.upazila.toLowerCase().includes(filters.upazila!.toLowerCase()) ||
        r.upazilaBn.includes(filters.upazila!)
      );
    }

    if (filters.mouza) {
      result = result.filter(r => 
        r.mouza.toLowerCase().includes(filters.mouza!.toLowerCase()) ||
        r.mouzaBn.includes(filters.mouza!)
      );
    }

    if (filters.khatianNo) {
      result = result.filter(r => 
        r.khatianNo === filters.khatianNo ||
        r.surveys.some(s => s.khatianNo === filters.khatianNo)
      );
    }

    if (filters.dagNo) {
      result = result.filter(r => 
        r.dagNo === filters.dagNo ||
        r.surveys.some(s => s.dagNo === filters.dagNo)
      );
    }

    if (filters.minArea !== undefined) {
      result = result.filter(r => r.areaDecimals >= filters.minArea!);
    }

    if (filters.maxArea !== undefined) {
      result = result.filter(r => r.areaDecimals <= filters.maxArea!);
    }

    if (filters.statusFilter === 'clean') {
      result = result.filter(r => !r.hasCaveatOrDispute && r.mutation?.status === 'approved');
    } else if (filters.statusFilter === 'has_issues') {
      result = result.filter(r => r.hasCaveatOrDispute || r.mutation?.status !== 'approved');
    }

    return result;
  }

  getRecordById(id: string): LandRecord | undefined {
    return this.records.find(r => r.id === id);
  }

  addRecord(record: LandRecord): LandRecord {
    this.records.unshift(record);
    this.logAction('CREATE_LAND_RECORD', 'land_record', record.id, `Created record Dag ${record.dagNo}, Mouza ${record.mouza}`);
    return record;
  }

  updateRecord(id: string, updates: Partial<LandRecord>): LandRecord | undefined {
    const idx = this.records.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    this.records[idx] = { ...this.records[idx], ...updates, updatedAt: new Date().toISOString() };
    this.logAction('UPDATE_LAND_RECORD', 'land_record', id, `Updated record fields`);
    return this.records[idx];
  }

  deleteRecord(id: string): boolean {
    const idx = this.records.findIndex(r => r.id === id);
    if (idx === -1) return false;
    this.records.splice(idx, 1);
    this.logAction('DELETE_LAND_RECORD', 'land_record', id, `Deleted record`);
    return true;
  }

  // --- Verifications ---
  getVerifications(): VerificationResult[] {
    return [...this.verifications];
  }

  getVerificationById(id: string): VerificationResult | undefined {
    return this.verifications.find(v => v.id === id || v.landRecordId === id);
  }

  createVerification(record: LandRecord, userId?: string): VerificationResult {
    const result = analyzeLandRecordRisks(record);
    if (userId) result.userId = userId;
    this.verifications.unshift(result);
    this.logAction('RUN_VERIFICATION', 'verification', result.id, `Risk score: ${result.overallScore}, Level: ${result.overallLevel}`, userId);
    return result;
  }

  // --- Documents ---
  getDocuments(userId?: string): DocumentRecord[] {
    if (!userId) return [...this.documents];
    return this.documents.filter(d => d.userId === userId);
  }

  addDocument(doc: DocumentRecord): DocumentRecord {
    this.documents.unshift(doc);
    this.logAction('UPLOAD_DOCUMENT', 'document', doc.id, `Uploaded ${doc.fileName} (${doc.documentType})`, doc.userId);
    return doc;
  }

  // --- Land Document Applications ---
  getApplications(filters?: {
    citizenId?: string;
    officerId?: string;
    status?: ApplicationStatus;
    documentType?: string;
    search?: string;
  }): LandApplication[] {
    let list = [...this.applications];

    if (filters?.citizenId) {
      list = list.filter((a) => a.citizenId === filters.citizenId);
    }

    if (filters?.officerId) {
      list = list.filter(
        (a) => !a.assignedOfficerId || a.assignedOfficerId === filters.officerId
      );
    }

    if (filters?.status) {
      list = list.filter((a) => a.status === filters.status);
    }

    if (filters?.documentType && filters.documentType !== 'all') {
      list = list.filter((a) => a.documentType === filters.documentType);
    }

    if (filters?.search) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.applicationNumber.toLowerCase().includes(q) ||
          a.citizenName.toLowerCase().includes(q) ||
          a.district.toLowerCase().includes(q) ||
          a.upazila.toLowerCase().includes(q) ||
          a.mouza.toLowerCase().includes(q) ||
          a.dagNo.includes(q) ||
          a.khatianNo.includes(q)
      );
    }

    // Sort by recent first
    return list.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  getApplicationById(id: string): LandApplication | undefined {
    return this.applications.find(
      (a) => a.id === id || a.applicationNumber === id
    );
  }

  getApplicationByNumber(appNum: string): LandApplication | undefined {
    return this.applications.find(
      (a) => a.applicationNumber.toLowerCase() === appNum.trim().toLowerCase()
    );
  }

  createApplication(
    data: Omit<
      LandApplication,
      'id' | 'applicationNumber' | 'status' | 'submittedAt' | 'updatedAt' | 'attachments' | 'statusHistory'
    >,
    attachments: ApplicationAttachment[] = []
  ): LandApplication {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const year = new Date().getFullYear();
    const appNumber = `APP-${year}-${randomSuffix}`;
    const id = `app-${Date.now()}-${randomSuffix}`;
    const now = new Date().toISOString();

    const initialHistory: ApplicationStatusHistory = {
      id: `hist-${Date.now()}-1`,
      applicationId: id,
      oldStatus: 'Draft',
      newStatus: 'Pending',
      changedBy: data.citizenId,
      changedByName: data.citizenName,
      reason: 'Citizen submitted land document application',
      createdAt: now,
    };

    const newApp: LandApplication = {
      ...data,
      id,
      applicationNumber: appNumber,
      status: 'Pending',
      submittedAt: now,
      updatedAt: now,
      attachments: attachments.map((att) => ({ ...att, applicationId: id })),
      statusHistory: [initialHistory],
    };

    this.applications.unshift(newApp);

    // Audit log
    this.logAction(
      'SUBMIT_APPLICATION',
      'application',
      id,
      `Citizen ${data.citizenName} submitted application ${appNumber} for ${data.documentType}`,
      data.citizenId
    );

    // Create confirmation in-app notification for citizen
    this.createNotification(
      data.citizenId,
      'Application Submitted Successfully',
      `Your application ${appNumber} for ${data.documentType.replace(/_/g, ' ')} has been received and is pending review.`,
      'info',
      id
    );

    // Create notification for land officers
    this.createNotification(
      'user-officer-02',
      'New Application Received',
      `New application ${appNumber} (${data.mouza}, Dag #${data.dagNo}) submitted by ${data.citizenName}.`,
      'info',
      id
    );

    return newApp;
  }

  updateApplicationStatus(
    id: string,
    newStatus: ApplicationStatus,
    actorId: string,
    actorName: string,
    params?: {
      reason?: string;
      officerMessage?: string;
      correctionInstructions?: string;
      internalNotes?: string;
    }
  ): LandApplication | null {
    const app = this.getApplicationById(id);
    if (!app) return null;

    const oldStatus = app.status;
    const now = new Date().toISOString();

    const historyEntry: ApplicationStatusHistory = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      applicationId: app.id,
      oldStatus,
      newStatus,
      changedBy: actorId,
      changedByName: actorName,
      reason: params?.reason || `Status updated from ${oldStatus} to ${newStatus}`,
      createdAt: now,
    };

    app.status = newStatus;
    app.updatedAt = now;
    app.statusHistory.unshift(historyEntry);

    if (params?.officerMessage !== undefined) app.officerMessage = params.officerMessage;
    if (params?.correctionInstructions !== undefined) app.correctionInstructions = params.correctionInstructions;
    if (params?.internalNotes !== undefined) app.internalNotes = params.internalNotes;
    if (newStatus === 'Approved') app.approvedAt = now;
    if (newStatus === 'Rejected') {
      app.rejectedAt = now;
      if (params?.reason) app.rejectionReason = params.reason;
    }

    // Audit log
    this.logAction(
      'UPDATE_APPLICATION_STATUS',
      'application',
      app.id,
      `Status changed to ${newStatus} by ${actorName} (${actorId}). Note: ${params?.reason || 'None'}`,
      actorId
    );

    // Citizen notifications based on status transition
    if (newStatus === 'Under_Review') {
      this.createNotification(
        app.citizenId,
        'Application Under Review',
        `Land Officer ${actorName} has begun reviewing your application ${app.applicationNumber}.`,
        'info',
        app.id
      );
    } else if (newStatus === 'Correction_Required') {
      this.createNotification(
        app.citizenId,
        'Correction Required on Application',
        `Correction requested on ${app.applicationNumber}: ${params?.correctionInstructions || params?.reason || 'Please review officer instructions.'}`,
        'action_required',
        app.id
      );
    } else if (newStatus === 'Approved') {
      this.createNotification(
        app.citizenId,
        'Application Approved',
        `Your application ${app.applicationNumber} has been approved by the Land Officer.`,
        'success',
        app.id
      );
    } else if (newStatus === 'Rejected') {
      this.createNotification(
        app.citizenId,
        'Application Rejected',
        `Your application ${app.applicationNumber} was not approved. Reason: ${params?.reason || 'Does not meet documentary requirements.'}`,
        'rejection',
        app.id
      );
    } else if (newStatus === 'Document_Available') {
      this.createNotification(
        app.citizenId,
        'Document Ready for Secure Download',
        `Your authorized document for application ${app.applicationNumber} is now available in My Documents.`,
        'success',
        app.id
      );
    }

    return app;
  }

  uploadOfficialDocument(
    applicationId: string,
    docData: Omit<OfficialDocumentRecord, 'id' | 'uploadedAt' | 'isActive' | 'documentVersion'>
  ): OfficialDocumentRecord | null {
    const app = this.getApplicationById(applicationId);
    if (!app) return null;

    const now = new Date().toISOString();
    const docId = `off-doc-${Date.now()}`;
    const newVersion = app.officialDocument ? app.officialDocument.documentVersion + 1 : 1;

    const officialDoc: OfficialDocumentRecord = {
      ...docData,
      id: docId,
      documentVersion: newVersion,
      isActive: true,
      uploadedAt: now,
    };

    app.officialDocument = officialDoc;
    app.status = 'Document_Available';
    app.updatedAt = now;

    // Add status history
    app.statusHistory.unshift({
      id: `hist-${Date.now()}-doc`,
      applicationId: app.id,
      oldStatus: 'Approved',
      newStatus: 'Document_Available',
      changedBy: docData.uploadedBy,
      changedByName: docData.uploaderName || 'Authorized Land Officer',
      reason: `Uploaded certified document: ${docData.fileName} (v${newVersion})`,
      createdAt: now,
    });

    // Also register in general documents list for officer inspection
    this.documents.unshift({
      id: docId,
      userId: docData.uploadedBy,
      fileName: docData.fileName,
      fileUrl: `/api/applications/${app.id}/download`,
      fileSize: docData.fileSize,
      mimeType: 'application/pdf',
      documentType: app.documentType === 'khatian_copy' ? 'khatian' : 'deed',
      extractedFields: {
        district: app.district,
        upazila: app.upazila,
        mouza: app.mouza,
        dagNo: app.dagNo,
        khatianNo: app.khatianNo,
        ownerNames: [app.citizenName],
        confidenceScore: 0.98,
        fieldConfidence: {},
      },
      reviewStatus: 'reviewed',
      createdAt: now,
    });

    // Audit log
    this.logAction(
      'UPLOAD_OFFICIAL_DOCUMENT',
      'application',
      app.id,
      `Official PDF ${docData.fileName} uploaded for application ${app.applicationNumber}`,
      docData.uploadedBy
    );

    // Notify citizen
    this.createNotification(
      app.citizenId,
      'Authorized Document Available for Download',
      `Your requested certified document ${docData.fileName} for application ${app.applicationNumber} is ready for download.`,
      'success',
      app.id
    );

    return officialDoc;
  }

  addApplicationAttachment(
    applicationId: string,
    attachment: Omit<ApplicationAttachment, 'id' | 'createdAt'>
  ): ApplicationAttachment | null {
    const app = this.getApplicationById(applicationId);
    if (!app) return null;

    const newAttachment: ApplicationAttachment = {
      ...attachment,
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };

    app.attachments.push(newAttachment);
    app.updatedAt = new Date().toISOString();

    return newAttachment;
  }

  // --- Notifications ---
  getNotifications(recipientId: string): InAppNotification[] {
    return this.notifications
      .filter((n) => n.recipientId === recipientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createNotification(
    recipientId: string,
    title: string,
    message: string,
    type: InAppNotification['type'] = 'info',
    applicationId?: string,
    listingId?: string
  ): InAppNotification {
    const notif: InAppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientId,
      applicationId,
      listingId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(notif);
    return notif;
  }

  markNotificationAsRead(id: string, recipientId: string): boolean {
    const notif = this.notifications.find(
      (n) => n.id === id && n.recipientId === recipientId
    );
    if (!notif) return false;
    notif.isRead = true;
    return true;
  }

  markAllNotificationsAsRead(recipientId: string): boolean {
    let updated = false;
    this.notifications.forEach((n) => {
      if (n.recipientId === recipientId && !n.isRead) {
        n.isRead = true;
        updated = true;
      }
    });
    return updated;
  }

  // --- Marketplace Methods ---

  getListings(filters?: {
    status?: ListingStatus | 'all';
    sellerId?: string;
    district?: string;
    upazila?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    query?: string;
    verificationStatus?: string;
    sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'area_desc';
    page?: number;
    limit?: number;
  }): {
    listings: LandListing[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    let result = [...this.listings];

    // Status filter
    if (filters?.status && filters.status !== 'all') {
      result = result.filter((l) => l.status === filters.status);
    } else if (!filters?.status && !filters?.sellerId) {
      // Default public browsing: only Published
      result = result.filter((l) => l.status === 'Published');
    }

    if (filters?.sellerId) {
      result = result.filter((l) => l.sellerId === filters.sellerId);
    }

    if (filters?.district && filters.district !== 'all') {
      const qDist = filters.district.toLowerCase();
      result = result.filter((l) => l.district.toLowerCase() === qDist);
    }

    if (filters?.upazila && filters.upazila !== 'all') {
      const qUpz = filters.upazila.toLowerCase();
      result = result.filter((l) => l.upazila.toLowerCase() === qUpz);
    }

    if (filters?.propertyType && filters.propertyType !== 'all') {
      result = result.filter((l) => l.propertyType === filters.propertyType);
    }

    if (filters?.verificationStatus && filters.verificationStatus !== 'all') {
      result = result.filter((l) => l.verificationStatus === filters.verificationStatus);
    }

    if (filters?.minPrice !== undefined && filters.minPrice > 0) {
      result = result.filter((l) => l.priceBdt >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined && filters.maxPrice > 0) {
      result = result.filter((l) => l.priceBdt <= filters.maxPrice!);
    }

    if (filters?.minArea !== undefined && filters.minArea > 0) {
      result = result.filter((l) => l.areaValue >= filters.minArea!);
    }

    if (filters?.maxArea !== undefined && filters.maxArea > 0) {
      result = result.filter((l) => l.areaValue <= filters.maxArea!);
    }

    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter((l) =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.mouza.toLowerCase().includes(q) ||
        (l.nearbyLandmarks && l.nearbyLandmarks.toLowerCase().includes(q)) ||
        (l.khatianNo && l.khatianNo.toLowerCase().includes(q)) ||
        (l.dagNo && l.dagNo.toLowerCase().includes(q))
      );
    }

    // Sorting
    const sortBy = filters?.sortBy || 'newest';
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => a.priceBdt - b.priceBdt);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.priceBdt - a.priceBdt);
    } else if (sortBy === 'area_desc') {
      result.sort((a, b) => b.areaValue - a.areaValue);
    }

    const total = result.length;
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.max(1, filters?.limit || 12);
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      listings: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  getListingById(id: string): LandListing | undefined {
    return this.listings.find((l) => l.id === id);
  }

  getListingByNumber(num: string): LandListing | undefined {
    return this.listings.find((l) => l.listingNumber === num);
  }

  createListing(
    data: Omit<
      LandListing,
      'id' | 'listingNumber' | 'status' | 'verificationStatus' | 'createdAt' | 'updatedAt' | 'images' | 'documents'
    >,
    images: { storagePath: string; isCover: boolean; caption?: string }[] = [],
    documents: { fileName: string; storageKey: string; fileType: string; fileSize: number }[] = []
  ): LandListing {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const year = new Date().getFullYear();
    const listingNumber = `LST-${year}-${randomSuffix}`;
    const id = `lst-${Date.now()}-${randomSuffix}`;
    const now = new Date().toISOString();

    const formattedImages: LandListingImage[] = images.length > 0
      ? images.map((img, idx) => ({
          id: `img-${Date.now()}-${idx}`,
          listingId: id,
          storagePath: img.storagePath,
          isCover: img.isCover,
          caption: img.caption,
          createdAt: now,
        }))
      : [
          {
            id: `img-${Date.now()}-0`,
            listingId: id,
            storagePath: data.coverImage || '/images/properties/residential-plot.svg',
            isCover: true,
            caption: 'Cover photograph',
            createdAt: now,
          },
        ];

    const formattedDocs: LandListingDocument[] = documents.map((doc, idx) => ({
      id: `doc-${Date.now()}-${idx}`,
      listingId: id,
      fileName: doc.fileName,
      storageKey: doc.storageKey,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      uploadedBy: data.sellerId,
      createdAt: now,
    }));

    const newListing: LandListing = {
      ...data,
      id,
      listingNumber,
      status: 'Pending Review',
      verificationStatus: 'Not Verified',
      verificationBadgeExplanation: 'Newly submitted listing under initial moderation review. Not yet verified.',
      coverImage: formattedImages.find((img) => img.isCover)?.storagePath || formattedImages[0].storagePath,
      images: formattedImages,
      documents: formattedDocs,
      createdAt: now,
      updatedAt: now,
    };

    this.listings.unshift(newListing);

    // Initial review history
    const initialHistory: ListingReviewHistory = {
      id: `rev-${Date.now()}-1`,
      listingId: id,
      reviewerId: data.sellerId,
      reviewerName: data.sellerName,
      oldStatus: 'Draft',
      newStatus: 'Pending Review',
      reason: 'Seller submitted listing for marketplace moderation',
      createdAt: now,
    };
    this.listingReviewHistory.unshift(initialHistory);

    // Audit log
    this.logAction(
      'CREATE_LISTING',
      'listing',
      id,
      `Seller ${data.sellerName} submitted listing ${listingNumber}: "${data.title}"`,
      data.sellerId
    );

    // Confirmation notification to seller
    this.createNotification(
      data.sellerId,
      'Listing Submitted for Review',
      `Your land listing ${listingNumber} ("${data.title}") has been received and is pending moderation review.`,
      'info',
      undefined,
      id
    );

    // Alert officer/moderator
    this.createNotification(
      'user-officer-02',
      'New Land Listing Pending Moderation',
      `New land listing ${listingNumber} (${data.district}, ${data.upazila}) submitted by ${data.sellerName}.`,
      'info',
      undefined,
      id
    );

    return newListing;
  }

  updateListing(
    id: string,
    sellerId: string,
    updates: Partial<LandListing>
  ): { success: boolean; listing?: LandListing; error?: string } {
    const listing = this.getListingById(id);
    if (!listing) {
      return { success: false, error: 'Listing not found.' };
    }

    if (listing.sellerId !== sellerId) {
      return { success: false, error: 'Unauthorized: You can only edit your own listings.' };
    }

    if (listing.status === 'Sold' || listing.status === 'Closed') {
      // Allow marking back to active or updating non-critical fields, or prevent if closed
      if (updates.status && ['Sold', 'Closed'].includes(updates.status)) {
        listing.status = updates.status;
        listing.updatedAt = new Date().toISOString();
        return { success: true, listing };
      }
    }

    const now = new Date().toISOString();

    // Prevent seller from directly changing status to Published or Verified
    const safeUpdates = { ...updates };
    delete (safeUpdates as any).id;
    delete (safeUpdates as any).listingNumber;
    delete (safeUpdates as any).sellerId;
    delete (safeUpdates as any).verificationStatus;
    delete (safeUpdates as any).verificationBadgeExplanation;

    // If listing was Published and seller modifies price, title, area, or description, return to Pending Review
    let statusReverted = false;
    if (
      listing.status === 'Published' &&
      (updates.priceBdt !== undefined ||
        updates.title !== undefined ||
        updates.areaValue !== undefined ||
        updates.description !== undefined)
    ) {
      listing.status = 'Pending Review';
      listing.reviewReason = 'Seller made critical updates after publication; returned for re-moderation.';
      statusReverted = true;

      this.listingReviewHistory.unshift({
        id: `rev-${Date.now()}`,
        listingId: id,
        reviewerId: sellerId,
        reviewerName: listing.sellerName,
        oldStatus: 'Published',
        newStatus: 'Pending Review',
        reason: 'Seller modified listing details; reverted to Pending Review',
        createdAt: now,
      });

      this.createNotification(
        sellerId,
        'Listing Re-submitted for Moderation',
        `Your listing ${listing.listingNumber} was updated and returned to Pending Review for moderation check.`,
        'info',
        undefined,
        id
      );
    } else if (updates.status === 'Sold' || updates.status === 'Closed') {
      listing.status = updates.status;
    } else if (listing.status === 'Correction Required' && updates.status === 'Pending Review') {
      listing.status = 'Pending Review';
      listing.reviewReason = 'Seller submitted corrections.';
    }

    Object.assign(listing, safeUpdates);
    listing.updatedAt = now;

    this.logAction(
      'UPDATE_LISTING',
      'listing',
      id,
      `Seller updated listing ${listing.listingNumber}${statusReverted ? ' (returned to Pending Review)' : ''}`,
      sellerId
    );

    return { success: true, listing };
  }

  updateListingStatus(
    id: string,
    newStatus: ListingStatus,
    reviewerId: string,
    reviewerName: string,
    params?: {
      reason?: string;
      correctionInstructions?: string;
      verificationStatus?: ListingVerificationStatus;
      verificationBadgeExplanation?: string;
    }
  ): { success: boolean; listing?: LandListing; error?: string } {
    const listing = this.getListingById(id);
    if (!listing) {
      return { success: false, error: 'Listing not found.' };
    }

    const oldStatus = listing.status;
    const now = new Date().toISOString();

    listing.status = newStatus;
    listing.updatedAt = now;

    if (params?.verificationStatus) {
      listing.verificationStatus = params.verificationStatus;
    }
    if (params?.verificationBadgeExplanation) {
      listing.verificationBadgeExplanation = params.verificationBadgeExplanation;
    }
    if (params?.reason) {
      listing.reviewReason = params.reason;
    }
    if (params?.correctionInstructions) {
      listing.correctionInstructions = params.correctionInstructions;
    }

    if (newStatus === 'Published') {
      listing.publishedAt = now;
      if (!listing.verificationBadgeExplanation) {
        listing.verificationBadgeExplanation =
          listing.verificationStatus === 'Officer Verified'
            ? 'Official Land Registry record cross-check completed by authorized Land Officer.'
            : 'Moderation review approved for public marketplace display.';
      }
    }

    // Record review history
    const historyItem: ListingReviewHistory = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      listingId: id,
      reviewerId,
      reviewerName,
      oldStatus,
      newStatus,
      reason: params?.reason || params?.correctionInstructions || `Status updated from ${oldStatus} to ${newStatus}`,
      createdAt: now,
    };
    this.listingReviewHistory.unshift(historyItem);

    // Audit log
    this.logAction(
      'MODERATE_LISTING',
      'listing',
      id,
      `Reviewer ${reviewerName} changed status of ${listing.listingNumber} from ${oldStatus} to ${newStatus}`,
      reviewerId
    );

    // Notify seller
    let notifTitle = `Listing Status: ${newStatus}`;
    let notifType: InAppNotification['type'] = 'info';
    let notifMsg = `Your listing ${listing.listingNumber} is now ${newStatus}.`;

    if (newStatus === 'Published') {
      notifTitle = 'Listing Approved & Published!';
      notifType = 'success';
      notifMsg = `Congratulations! Your land listing ${listing.listingNumber} ("${listing.title}") has been approved and is now live on the Buy Land marketplace.`;
    } else if (newStatus === 'Correction Required') {
      notifTitle = 'Corrections Required on Listing';
      notifType = 'action_required';
      notifMsg = `Moderator requested corrections for ${listing.listingNumber}: ${params?.correctionInstructions || params?.reason || 'Please review your property details.'}`;
    } else if (newStatus === 'Rejected') {
      notifTitle = 'Listing Rejected by Moderator';
      notifType = 'rejection';
      notifMsg = `Your listing ${listing.listingNumber} was rejected: ${params?.reason || 'Does not meet marketplace guidelines.'}`;
    }

    this.createNotification(listing.sellerId, notifTitle, notifMsg, notifType, undefined, id);

    // If listing became Sold or Closed, notify active interested buyers
    if (newStatus === 'Sold' || newStatus === 'Closed') {
      const activeInterests = this.listingInterests.filter(
        (i) => i.listingId === id && i.status === 'Active'
      );
      activeInterests.forEach((interest) => {
        this.createNotification(
          interest.buyerId,
          `Listing ${newStatus}: ${listing.title}`,
          `A land listing you were interested in (${listing.listingNumber}) has been marked as ${newStatus}.`,
          'info',
          undefined,
          id
        );
      });
    }

    return { success: true, listing };
  }

  expressInterest(
    listingId: string,
    buyer: {
      id: string;
      name: string;
      phone: string;
      email: string;
      message?: string;
    }
  ): { success: boolean; interest?: LandListingInterest; error?: string } {
    const listing = this.getListingById(listingId);
    if (!listing) {
      return { success: false, error: 'Listing not found.' };
    }

    if (listing.status !== 'Published') {
      return {
        success: false,
        error: `Cannot express interest: This listing is currently ${listing.status}. Only Published listings accept buyer inquiries.`,
      };
    }

    if (listing.sellerId === buyer.id) {
      return { success: false, error: 'You cannot express interest in your own listing.' };
    }

    // Check duplicate
    const existing = this.listingInterests.find(
      (i) => i.listingId === listingId && i.buyerId === buyer.id && i.status === 'Active'
    );
    if (existing) {
      return {
        success: false,
        error: 'You have already expressed interest in this property. The seller has your contact details.',
      };
    }

    const now = new Date().toISOString();
    const newInterest: LandListingInterest = {
      id: `int-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      listingId,
      buyerId: buyer.id,
      buyerName: buyer.name,
      buyerPhone: buyer.phone,
      buyerEmail: buyer.email,
      message: buyer.message,
      status: 'Active',
      createdAt: now,
      updatedAt: now,
    };

    this.listingInterests.unshift(newInterest);

    // Audit log
    this.logAction(
      'EXPRESS_INTEREST',
      'listing_interest',
      newInterest.id,
      `Buyer ${buyer.name} expressed interest in listing ${listing.listingNumber}`,
      buyer.id
    );

    // Notify seller
    this.createNotification(
      listing.sellerId,
      'New Buyer Interest Received!',
      `${buyer.name} expressed interest in your listing "${listing.title}". Phone: ${buyer.phone}. Message: "${buyer.message || 'Interested in inspection'}"`,
      'info',
      undefined,
      listingId
    );

    return { success: true, interest: newInterest };
  }

  withdrawInterest(listingId: string, buyerId: string): { success: boolean; error?: string } {
    const interest = this.listingInterests.find(
      (i) => i.listingId === listingId && i.buyerId === buyerId && i.status === 'Active'
    );
    if (!interest) {
      return { success: false, error: 'Active interest record not found.' };
    }

    interest.status = 'Withdrawn';
    interest.updatedAt = new Date().toISOString();

    this.logAction(
      'WITHDRAW_INTEREST',
      'listing_interest',
      interest.id,
      `Buyer withdrew interest for listing ${listingId}`,
      buyerId
    );

    return { success: true };
  }

  getInterestsForListing(listingId: string, sellerId: string): LandListingInterest[] {
    const listing = this.getListingById(listingId);
    if (!listing) return [];

    // Allow seller or officer/admin
    if (listing.sellerId !== sellerId && !sellerId.includes('officer') && !sellerId.includes('admin')) {
      return [];
    }

    return this.listingInterests.filter((i) => i.listingId === listingId);
  }

  getInterestsForBuyer(buyerId: string): { interest: LandListingInterest; listing: LandListing }[] {
    const interests = this.listingInterests.filter((i) => i.buyerId === buyerId);
    const results: { interest: LandListingInterest; listing: LandListing }[] = [];

    interests.forEach((interest) => {
      const listing = this.getListingById(interest.listingId);
      if (listing) {
        results.push({ interest, listing });
      }
    });

    return results;
  }

  getReviewHistoryForListing(listingId: string): ListingReviewHistory[] {
    return this.listingReviewHistory.filter((r) => r.listingId === listingId);
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  logAction(action: string, resourceType: string, resourceId?: string, details: string = '', userId?: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      resourceType,
      resourceId,
      details,
      timestamp: new Date().toISOString(),
      userId,
      userEmail: userId ? `${userId}@citizen.gov.bd` : 'anonymous@user.bd'
    };
    this.auditLogs.unshift(log);
  }
}

// Global singleton pattern for Next.js to prevent stale instances during hot-reloads
const globalForDataStore = globalThis as unknown as { dataStore?: DataStore };

function initOrUpgradeDataStore(): DataStore {
  const existing = globalForDataStore.dataStore as any;

  if (existing) {
    // 1. Ensure the prototype is updated to the latest DataStore.prototype
    Object.setPrototypeOf(existing, DataStore.prototype);

    // 2. Explicitly bind all methods to the existing instance
    for (const key of Object.getOwnPropertyNames(DataStore.prototype)) {
      if (key !== 'constructor' && typeof (DataStore.prototype as any)[key] === 'function') {
        try {
          existing[key] = (DataStore.prototype as any)[key].bind(existing);
        } catch {
          // ignore read-only properties if any
        }
      }
    }

    // 3. Guarantee all collections are populated with valid arrays
    if (!Array.isArray(existing.records) || existing.records.length === 0) {
      existing.records = [...MOCK_LAND_RECORDS];
    }
    if (!Array.isArray(existing.verifications)) {
      existing.verifications = [];
    }
    if (!Array.isArray(existing.documents)) {
      existing.documents = [...INITIAL_DOCUMENTS];
    }
    if (!Array.isArray(existing.applications)) {
      existing.applications = [...INITIAL_APPLICATIONS];
    }
    if (!Array.isArray(existing.notifications)) {
      existing.notifications = [...INITIAL_NOTIFICATIONS];
    }
    if (!Array.isArray(existing.listings) || existing.listings.length === 0) {
      existing.listings = [...INITIAL_LISTINGS];
    }
    if (!Array.isArray(existing.listingInterests)) {
      existing.listingInterests = [];
    }
    if (!Array.isArray(existing.listingReviewHistory)) {
      existing.listingReviewHistory = [];
    }
    if (!Array.isArray(existing.auditLogs)) {
      existing.auditLogs = [];
    }

    return existing as DataStore;
  }

  const fresh = new DataStore();
  globalForDataStore.dataStore = fresh;
  return fresh;
}

export const dataStore: DataStore = initOrUpgradeDataStore();

// Standalone function exports for direct fail-safe imports across all API routes & server components
export function getApplications(filters?: Parameters<DataStore['getApplications']>[0]) {
  if (typeof dataStore?.getApplications === 'function') {
    return dataStore.getApplications(filters);
  }
  return DataStore.prototype.getApplications.call(dataStore || globalForDataStore.dataStore, filters);
}

// Aliases to prevent legacy undefined errors
export const fetchApplications = getApplications;
export const fetchApps = getApplications;

export function getApplicationById(id: string) {
  if (typeof dataStore?.getApplicationById === 'function') {
    return dataStore.getApplicationById(id);
  }
  return DataStore.prototype.getApplicationById.call(dataStore || globalForDataStore.dataStore, id);
}

export function getApplicationByNumber(num: string) {
  if (typeof dataStore?.getApplicationByNumber === 'function') {
    return dataStore.getApplicationByNumber(num);
  }
  return DataStore.prototype.getApplicationByNumber.call(dataStore || globalForDataStore.dataStore, num);
}

export function createApplication(
  data: Parameters<DataStore['createApplication']>[0],
  attachments?: Parameters<DataStore['createApplication']>[1]
) {
  if (typeof dataStore?.createApplication === 'function') {
    return dataStore.createApplication(data, attachments);
  }
  return DataStore.prototype.createApplication.call(dataStore || globalForDataStore.dataStore, data, attachments);
}

export function updateApplicationStatus(
  id: string,
  newStatus: ApplicationStatus,
  actorId: string,
  actorName: string,
  params?: Parameters<DataStore['updateApplicationStatus']>[4]
) {
  if (typeof dataStore?.updateApplicationStatus === 'function') {
    return dataStore.updateApplicationStatus(id, newStatus, actorId, actorName, params);
  }
  return DataStore.prototype.updateApplicationStatus.call(
    dataStore || globalForDataStore.dataStore,
    id,
    newStatus,
    actorId,
    actorName,
    params
  );
}

export function uploadOfficialDocument(
  applicationId: string,
  docData: Parameters<DataStore['uploadOfficialDocument']>[1]
) {
  if (typeof dataStore?.uploadOfficialDocument === 'function') {
    return dataStore.uploadOfficialDocument(applicationId, docData);
  }
  return DataStore.prototype.uploadOfficialDocument.call(
    dataStore || globalForDataStore.dataStore,
    applicationId,
    docData
  );
}

export function addApplicationAttachment(
  applicationId: string,
  attachment: Parameters<DataStore['addApplicationAttachment']>[1]
) {
  if (typeof dataStore?.addApplicationAttachment === 'function') {
    return dataStore.addApplicationAttachment(applicationId, attachment);
  }
  return DataStore.prototype.addApplicationAttachment.call(
    dataStore || globalForDataStore.dataStore,
    applicationId,
    attachment
  );
}

export function getNotifications(recipientId: string) {
  if (typeof dataStore?.getNotifications === 'function') {
    return dataStore.getNotifications(recipientId);
  }
  return DataStore.prototype.getNotifications.call(dataStore || globalForDataStore.dataStore, recipientId);
}

export function createNotification(
  recipientId: string,
  title: string,
  message: string,
  type?: InAppNotification['type'],
  applicationId?: string
) {
  if (typeof dataStore?.createNotification === 'function') {
    return dataStore.createNotification(recipientId, title, message, type, applicationId);
  }
  return DataStore.prototype.createNotification.call(
    dataStore || globalForDataStore.dataStore,
    recipientId,
    title,
    message,
    type,
    applicationId
  );
}

export function markNotificationAsRead(id: string, recipientId: string) {
  if (typeof dataStore?.markNotificationAsRead === 'function') {
    return dataStore.markNotificationAsRead(id, recipientId);
  }
  return DataStore.prototype.markNotificationAsRead.call(
    dataStore || globalForDataStore.dataStore,
    id,
    recipientId
  );
}

export function markAllNotificationsAsRead(recipientId: string) {
  if (typeof dataStore?.markAllNotificationsAsRead === 'function') {
    return dataStore.markAllNotificationsAsRead(recipientId);
  }
  return DataStore.prototype.markAllNotificationsAsRead.call(dataStore || globalForDataStore.dataStore, recipientId);
}

export function getListings(filters?: Parameters<DataStore['getListings']>[0]) {
  if (typeof dataStore?.getListings === 'function') {
    return dataStore.getListings(filters);
  }
  return DataStore.prototype.getListings.call(dataStore || globalForDataStore.dataStore, filters);
}

export function getListingById(id: string) {
  if (typeof dataStore?.getListingById === 'function') {
    return dataStore.getListingById(id);
  }
  return DataStore.prototype.getListingById.call(dataStore || globalForDataStore.dataStore, id);
}

export function getListingByNumber(num: string) {
  if (typeof dataStore?.getListingByNumber === 'function') {
    return dataStore.getListingByNumber(num);
  }
  return DataStore.prototype.getListingByNumber.call(dataStore || globalForDataStore.dataStore, num);
}

export function createListing(
  data: Parameters<DataStore['createListing']>[0],
  images?: Parameters<DataStore['createListing']>[1],
  documents?: Parameters<DataStore['createListing']>[2]
) {
  if (typeof dataStore?.createListing === 'function') {
    return dataStore.createListing(data, images, documents);
  }
  return DataStore.prototype.createListing.call(dataStore || globalForDataStore.dataStore, data, images, documents);
}

export function updateListing(
  id: string,
  sellerId: string,
  updates: Parameters<DataStore['updateListing']>[2]
) {
  if (typeof dataStore?.updateListing === 'function') {
    return dataStore.updateListing(id, sellerId, updates);
  }
  return DataStore.prototype.updateListing.call(dataStore || globalForDataStore.dataStore, id, sellerId, updates);
}

export function updateListingStatus(
  id: string,
  newStatus: ListingStatus,
  reviewerId: string,
  reviewerName: string,
  params?: Parameters<DataStore['updateListingStatus']>[4]
) {
  if (typeof dataStore?.updateListingStatus === 'function') {
    return dataStore.updateListingStatus(id, newStatus, reviewerId, reviewerName, params);
  }
  return DataStore.prototype.updateListingStatus.call(
    dataStore || globalForDataStore.dataStore,
    id,
    newStatus,
    reviewerId,
    reviewerName,
    params
  );
}

export function expressInterest(
  listingId: string,
  buyer: Parameters<DataStore['expressInterest']>[1]
) {
  if (typeof dataStore?.expressInterest === 'function') {
    return dataStore.expressInterest(listingId, buyer);
  }
  return DataStore.prototype.expressInterest.call(dataStore || globalForDataStore.dataStore, listingId, buyer);
}

export function withdrawInterest(listingId: string, buyerId: string) {
  if (typeof dataStore?.withdrawInterest === 'function') {
    return dataStore.withdrawInterest(listingId, buyerId);
  }
  return DataStore.prototype.withdrawInterest.call(dataStore || globalForDataStore.dataStore, listingId, buyerId);
}

export function getInterestsForListing(listingId: string, sellerId: string) {
  if (typeof dataStore?.getInterestsForListing === 'function') {
    return dataStore.getInterestsForListing(listingId, sellerId);
  }
  return DataStore.prototype.getInterestsForListing.call(dataStore || globalForDataStore.dataStore, listingId, sellerId);
}

export function getInterestsForBuyer(buyerId: string) {
  if (typeof dataStore?.getInterestsForBuyer === 'function') {
    return dataStore.getInterestsForBuyer(buyerId);
  }
  return DataStore.prototype.getInterestsForBuyer.call(dataStore || globalForDataStore.dataStore, buyerId);
}

export function getReviewHistoryForListing(listingId: string) {
  if (typeof dataStore?.getReviewHistoryForListing === 'function') {
    return dataStore.getReviewHistoryForListing(listingId);
  }
  return DataStore.prototype.getReviewHistoryForListing.call(dataStore || globalForDataStore.dataStore, listingId);
}



