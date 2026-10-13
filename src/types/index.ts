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
