export type Language = 'en' | 'bn';

export type UserRole = 'citizen' | 'officer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  preferredLanguage: Language;
  createdAt: string;
}

export type SurveyType = 'CS' | 'SA' | 'RS' | 'BS' | 'City_Survey';

export interface SurveyRecordItem {
  surveyType: SurveyType;
  year: number;
  khatianNo: string;
  dagNo: string;
  recordedOwner: string;
  areaDecimals: number;
  landClass: string;
  remarks?: string;
  verifiedStatus: 'consistent' | 'discrepancy' | 'missing' | 'verified';
}

export interface OwnershipRecord {
  id: string;
  ownerName: string;
  ownerNameBn: string;
  fatherOrHusbandName: string;
  sharePortion: string; // e.g. "0.50 (৮ আনা)"
  acquisitionType: 'Inheritance' | 'Purchase (Kabala)' | 'Gift (Heba)' | 'Allotment' | 'Other';
  recordedDate: string;
  nidLastFour?: string;
}

export interface MutationRecord {
  id: string;
  caseNo: string;
  mutationKhatianNo: string;
  applicantName: string;
  status: 'approved' | 'pending' | 'rejected' | 'inconsistent';
  approvalDate?: string;
  dcrNumber?: string;
  acLandOffice: string;
  holdingNo?: string;
  lastTaxPaidYear?: number;
  remarks?: string;
}

export interface LandRecord {
  id: string;
  division: string;
  divisionBn: string;
  district: string;
  districtBn: string;
  upazila: string;
  upazilaBn: string;
  mouza: string;
  mouzaBn: string;
  jlNumber: string;
  khatianNo: string;
  dagNo: string;
  landClass: string;
  landClassBn: string;
  areaDecimals: number;
  currentSurvey: SurveyType;
  owners: OwnershipRecord[];
  surveys: SurveyRecordItem[];
  mutation?: MutationRecord;
  hasCaveatOrDispute: boolean;
  disputeDetails?: string;
  disputeDetailsBn?: string;
  sourceProvenance: string;
  isVerifiedByAuthority: boolean;
  isDemoData: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RiskSeverity = 'low' | 'medium' | 'high';
export type RiskCategory = 
  | 'ownership' 
  | 'area' 
  | 'mutation' 
  | 'historical_chain' 
  | 'legal_dispute' 
  | 'document_mismatch' 
  | 'tax_compliance';

export interface RiskFinding {
  id: string;
  category: RiskCategory;
  severity: RiskSeverity;
  ruleCode: string;
  titleEn: string;
  titleBn: string;
  reasonEn: string;
  reasonBn: string;
  evidence: string;
  evidenceBn: string;
  recommendedStepsEn: string;
  recommendedStepsBn: string;
}

export interface VerificationResult {
  id: string;
  verificationCode: string;
  userId?: string;
  landRecordId: string;
  landRecord?: LandRecord;
  createdAt: string;
  overallScore: number; // 0 (best) to 100 (highest risk)
  overallLevel: RiskSeverity; // 'low' (Low Concern) | 'medium' (Needs Review) | 'high' (High Priority Review)
  findings: RiskFinding[];
  summaryEn: string;
  summaryBn: string;
  aiExplanationEn?: string;
  aiExplanationBn?: string;
  buyerChecklistEn: string[];
  buyerChecklistBn: string[];
  disclaimerEn: string;
  disclaimerBn: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  documentType: 'deed' | 'khatian' | 'dcr' | 'mutation_order' | 'other';
  rawOcrText?: string;
  extractedFields: ExtractedDocumentFields;
  reviewStatus: 'pending' | 'reviewed' | 'discrepancy_found' | 'matched';
  createdAt: string;
}

export interface ExtractedDocumentFields {
  district?: string;
  upazila?: string;
  mouza?: string;
  dagNo?: string;
  khatianNo?: string;
  deedNo?: string;
  areaDecimals?: number;
  ownerNames: string[];
  deedDate?: string;
  confidenceScore: number; // 0 to 1
  fieldConfidence: Record<string, number>;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface SearchFilters {
  district?: string;
  upazila?: string;
  mouza?: string;
  khatianNo?: string;
  dagNo?: string;
  minArea?: number;
  maxArea?: number;
  surveyType?: SurveyType;
  statusFilter?: 'all' | 'clean' | 'has_issues';
}

export type ApplicationDocumentType =
  | 'khatian_copy'
  | 'porcha_record'
  | 'mutation_order'
  | 'dcr_duplicate'
  | 'certified_deed'
  | 'land_clearance_certificate';

export type ApplicationStatus =
  | 'Draft'
  | 'Pending'
  | 'Under_Review'
  | 'Correction_Required'
  | 'Approved'
  | 'Rejected'
  | 'Document_Available';

export type OwnershipRelation =
  | 'Owner'
  | 'Heir / Legal Successor'
  | 'Power of Attorney'
  | 'Prospective Buyer / Due Diligence'
  | 'Authorized Representative';

export interface ApplicationAttachment {
  id: string;
  applicationId: string;
  uploadedBy: string;
  fileName: string;
  storageKey: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface OfficialDocumentRecord {
  id: string;
  applicationId: string;
  storageKey: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploaderName?: string;
  documentVersion: number;
  verificationHash: string;
  isActive: boolean;
  uploadedAt: string;
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  oldStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  changedBy: string;
  changedByName: string;
  reason?: string;
  createdAt: string;
}

export interface LandApplication {
  id: string;
  applicationNumber: string; // e.g. "APP-2026-90412"
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  citizenEmail?: string;
  citizenNid?: string;
  district: string;
  upazila: string;
  mouza: string;
  jlNumber?: string;
  khatianNo: string;
  dagNo: string;
  ownershipRelation: OwnershipRelation;
  documentType: ApplicationDocumentType;
  purpose: string;
  additionalInfo?: string;
  status: ApplicationStatus;
  officerMessage?: string;
  rejectionReason?: string;
  correctionInstructions?: string;
  internalNotes?: string;
  assignedOfficerId?: string;
  assignedOffice: string;
  submittedAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  attachments: ApplicationAttachment[];
  officialDocument?: OfficialDocumentRecord;
  statusHistory: ApplicationStatusHistory[];
}

export interface InAppNotification {
  id: string;
  recipientId: string;
  applicationId?: string;
  listingId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'action_required' | 'rejection';
  isRead: boolean;
  createdAt: string;
}

// ==========================================
// MARKETPLACE: BUY & SELL LAND TYPES
// ==========================================

export type ListingPropertyType =
  | 'Agricultural'
  | 'Residential'
  | 'Commercial'
  | 'Industrial'
  | 'Other';

export type ListingAreaUnit = 'Decimal' | 'Katha' | 'Bigha' | 'Acre';

export type ListingStatus =
  | 'Draft'
  | 'Pending Review'
  | 'Under Review'
  | 'Correction Required'
  | 'Published'
  | 'Rejected'
  | 'Sold'
  | 'Closed';

export type ListingVerificationStatus =
  | 'Not Verified'
  | 'Preliminary Review'
  | 'Officer Verified';

export interface LandListingImage {
  id: string;
  listingId: string;
  storagePath: string; // URL or base64 data preview
  isCover: boolean;
  caption?: string;
  createdAt: string;
}

export interface LandListingDocument {
  id: string;
  listingId: string;
  fileName: string;
  storageKey: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

export interface LandListingInterest {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  message?: string;
  status: 'Active' | 'Withdrawn' | 'Contacted';
  createdAt: string;
  updatedAt: string;
}

export interface ListingReviewHistory {
  id: string;
  listingId: string;
  reviewerId: string;
  reviewerName: string;
  oldStatus: ListingStatus;
  newStatus: ListingStatus;
  reason?: string;
  createdAt: string;
}

export interface LandListing {
  id: string;
  listingNumber: string; // e.g. "LST-2026-10492"
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  showPhone: boolean;
  showEmail: boolean;
  title: string;
  propertyType: ListingPropertyType;
  priceBdt: number;
  isNegotiable: boolean;
  areaValue: number;
  areaUnit: ListingAreaUnit;
  district: string;
  upazila: string;
  mouza: string;
  locationDescription: string;
  latitude?: number;
  longitude?: number;
  description: string;
  roadAccess?: string;
  utilities?: string[];
  nearbyLandmarks?: string;
  khatianNo?: string;
  dagNo?: string;
  jlNumber?: string;
  coverImage: string;
  images: LandListingImage[];
  documents: LandListingDocument[];
  status: ListingStatus;
  verificationStatus: ListingVerificationStatus;
  verificationBadgeExplanation?: string;
  reviewReason?: string;
  correctionInstructions?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  isDemoData?: boolean;
}


