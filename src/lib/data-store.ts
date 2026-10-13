import { LandRecord, VerificationResult, DocumentRecord, AuditLog, SearchFilters } from '@/types';
import { MOCK_LAND_RECORDS } from './mock-data';
import { analyzeLandRecordRisks } from './risk-engine';

class DataStore {
  private records: LandRecord[] = [...MOCK_LAND_RECORDS];
  private verifications: VerificationResult[] = [];
  private documents: DocumentRecord[] = [];
  private auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      action: 'SYSTEM_BOOT',
      resourceType: 'system',
      details: 'LandCheck AI initialized with simulated survey archives.',
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

// Singleton instance
export const dataStore = new DataStore();
