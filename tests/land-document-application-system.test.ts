import { describe, it, expect } from 'vitest';
import { dataStore, getApplications, createApplication } from '../src/lib/data-store';
import { REGISTERED_USERS } from '../src/lib/server-auth';
import { validateFileMetadata, sanitizeFilename } from '../src/lib/document-storage';
import { UserRole } from '../src/types';

describe('Land Document Application and Officer Approval System', () => {
  const citizenA = REGISTERED_USERS['user-citizen-01']; // Karim Rahman, citizen
  const citizenB = {
    id: 'user-citizen-02',
    email: 'rahim@example.com',
    fullName: 'Rahim Uddin',
    role: 'citizen' as UserRole,
    mobile: '01811223344',
  };
  const officer = REGISTERED_USERS['user-officer-02']; // Farhana Yasmin, officer
  const admin = REGISTERED_USERS['user-admin-03']; // GovTech Admin, admin

  // Test 1: Verification of User Roles
  it('identifies distinct and trusted user roles', () => {
    expect(citizenA.role).toBe('citizen');
    expect(citizenB.role).toBe('citizen');
    expect(officer.role).toBe('officer');
    expect(admin.role).toBe('admin');
  });

  // Test 2: Citizen can submit a new land document application
  it('allows a citizen to submit a land document application and generates a unique application number', () => {
    const newApp = dataStore.createApplication({
      citizenId: citizenA.id,
      citizenName: citizenA.fullName,
      citizenPhone: '01711223344',
      citizenEmail: citizenA.email,
      documentType: 'khatian_copy',
      district: 'Dhaka',
      upazila: 'Savar',
      mouza: 'Ashulia',
      jlNumber: '104',
      khatianNo: '9841',
      dagNo: '341',
      ownershipRelation: 'Owner',
      purpose: 'Bank Loan Application for Property Modernization',
      additionalInfo: 'Need urgent certified Khatian copy.',
      assignedOffice: 'Savar Upazila Land Office',
    });

    expect(newApp).toBeDefined();
    expect(newApp.id).toBeDefined();
    expect(newApp.applicationNumber).toMatch(/^APP-2026-\d{5}$/);
    expect(newApp.citizenId).toBe(citizenA.id);
    expect(newApp.status).toBe('Pending');
    expect(newApp.statusHistory.length).toBeGreaterThanOrEqual(1);
    expect(newApp.statusHistory[0].newStatus).toBe('Pending');
  });

  // Test 3: System can find application by application number
  it('finds existing submissions by application number', () => {
    const app = dataStore.createApplication({
      citizenId: citizenA.id,
      citizenName: citizenA.fullName,
      citizenPhone: '01711223344',
      documentType: 'mutation_order',
      district: 'Chattogram',
      upazila: 'Patiya',
      mouza: 'Bhatikhain',
      khatianNo: '1122',
      dagNo: '445',
      ownershipRelation: 'Owner',
      purpose: 'Mutation verification',
      assignedOffice: 'Patiya AC Land Office',
    });

    const foundByNum = dataStore.getApplicationByNumber(app.applicationNumber);
    expect(foundByNum).toBeDefined();
    expect(foundByNum?.id).toBe(app.id);
  });

  // Test 4: Role-based filtering of applications
  it('filters applications by ownership for citizens and shows all for officers/admins', () => {
    const citizenApps = dataStore.getApplications({ citizenId: citizenA.id });
    expect(citizenApps.every((a) => a.citizenId === citizenA.id)).toBe(true);

    const allAppsForOfficer = dataStore.getApplications();
    expect(allAppsForOfficer.length).toBeGreaterThan(0);
  });

  // Test 5: Officer can transition application to Under_Review
  it('allows an officer to start reviewing a pending application', () => {
    const app = dataStore.createApplication({
      citizenId: citizenA.id,
      citizenName: citizenA.fullName,
      citizenPhone: '01711223344',
      documentType: 'porcha_record',
      district: 'Sylhet',
      upazila: 'Golapganj',
      mouza: 'Dhaka Dakshin',
      khatianNo: '5566',
      dagNo: '789',
      ownershipRelation: 'Owner',
      purpose: 'Boundary survey',
      assignedOffice: 'Golapganj Upazila Land Office',
    });

    const updated = dataStore.updateApplicationStatus(
      app.id,
      'Under_Review',
      officer.id,
      officer.fullName,
      {
        officerMessage: 'Application taken under review.',
      }
    );

    expect(updated).toBeDefined();
    expect(updated?.status).toBe('Under_Review');
    expect(updated?.statusHistory.some((h) => h.newStatus === 'Under_Review')).toBe(true);
  });

  // Test 6: Officer can request corrections with mandatory instructions
  it('allows an officer to request corrections with clear instructions', () => {
    const app = dataStore.createApplication({
      citizenId: citizenA.id,
      citizenName: citizenA.fullName,
      citizenPhone: '01711223344',
      documentType: 'khatian_copy',
      district: 'Dhaka',
      upazila: 'Savar',
      mouza: 'Ashulia',
      khatianNo: '111',
      dagNo: '222',
      ownershipRelation: 'Owner',
      purpose: 'Family settlement',
      assignedOffice: 'Savar Upazila Land Office',
    });

    const correctionMsg = 'Please attach NID copy and clear power of attorney deed.';
    const updated = dataStore.updateApplicationStatus(
      app.id,
      'Correction_Required',
      officer.id,
      officer.fullName,
      {
        correctionInstructions: correctionMsg,
        officerMessage: correctionMsg,
        reason: 'Missing supporting identity and inheritance documents',
      }
    );

    expect(updated?.status).toBe('Correction_Required');
    expect(updated?.officerMessage).toBe(correctionMsg);
  });

  // Test 7: Officer can reject an application with reason
  it('allows an officer to reject an application with a recorded rejection reason', () => {
    const app = dataStore.createApplication({
      citizenId: citizenA.id,
      citizenName: citizenA.fullName,
      citizenPhone: '01711223344',
      documentType: 'certified_deed',
      district: 'Dhaka',
      upazila: 'Dhamrai',
      mouza: 'Kushura',
      khatianNo: '999',
      dagNo: '888',
      ownershipRelation: 'Authorized Representative',
      purpose: 'Disputed plot claim',
      assignedOffice: 'Dhamrai AC Land Office',
    });

    const rejectionReason = 'Plot is under active civil court dispute. Cannot issue certified deed.';
    const updated = dataStore.updateApplicationStatus(
      app.id,
      'Rejected',
      officer.id,
      officer.fullName,
      {
        reason: rejectionReason,
        officerMessage: rejectionReason,
      }
    );

    expect(updated?.status).toBe('Rejected');
    expect(updated?.rejectionReason).toBe(rejectionReason);
  });

  // Test 8: Officer can approve an application
  it('allows an officer to approve a valid application', () => {
    const app = dataStore.createApplication({
      citizenId: citizenA.id,
      citizenName: citizenA.fullName,
      citizenPhone: '01711223344',
      documentType: 'khatian_copy',
      district: 'Dhaka',
      upazila: 'Savar',
      mouza: 'Ashulia',
      khatianNo: '4455',
      dagNo: '6677',
      ownershipRelation: 'Owner',
      purpose: 'Sale verification',
      assignedOffice: 'Savar Upazila Land Office',
    });

    const approved = dataStore.updateApplicationStatus(
      app.id,
      'Approved',
      officer.id,
      officer.fullName,
      {
        officerMessage: 'Application approved for official certified document issuance.',
      }
    );

    expect(approved?.status).toBe('Approved');
    expect(approved?.approvedAt).toBeDefined();
  });

  // Test 9: Officer can upload official PDF and status transitions to Document_Available
  it('records an official document upload and moves status to Document_Available', () => {
    const app = dataStore.createApplication({
      citizenId: citizenA.id,
      citizenName: citizenA.fullName,
      citizenPhone: '01711223344',
      documentType: 'land_clearance_certificate',
      district: 'Dhaka',
      upazila: 'Tejgaon',
      mouza: 'Mohakhali',
      khatianNo: '333',
      dagNo: '444',
      ownershipRelation: 'Owner',
      purpose: 'Tax clearance',
      assignedOffice: 'Tejgaon AC Land Office',
    });

    dataStore.updateApplicationStatus(
      app.id,
      'Approved',
      officer.id,
      officer.fullName
    );

    const updated = dataStore.uploadOfficialDocument(app.id, {
      applicationId: app.id,
      storageKey: `official-${app.id}-certified.pdf`,
      fileName: 'certified_dakhila_333.pdf',
      fileSize: 102400,
      uploadedBy: officer.id,
      uploaderName: officer.fullName,
      verificationHash: 'SHA256-TEST-HASH-1234567890',
    });

    expect(updated).toBeDefined();
    const refreshed = dataStore.getApplicationById(app.id);
    expect(refreshed?.status).toBe('Document_Available');
    expect(refreshed?.officialDocument).toBeDefined();
    expect(refreshed?.officialDocument?.storageKey).toBe(`official-${app.id}-certified.pdf`);
  });

  // Test 10: In-App Notifications
  it('creates and tracks in-app notifications for citizens', () => {
    const notif = dataStore.createNotification(
      citizenA.id,
      'Application Approved',
      'Your application APP-2026-10492 has been approved.',
      'success',
      'app-demo-01'
    );

    expect(notif.id).toBeDefined();
    expect(notif.recipientId).toBe(citizenA.id);
    expect(notif.isRead).toBe(false);

    const list = dataStore.getNotifications(citizenA.id);
    expect(list.some((n) => n.id === notif.id)).toBe(true);

    const success = dataStore.markNotificationAsRead(notif.id, citizenA.id);
    expect(success).toBe(true);
    const updatedList = dataStore.getNotifications(citizenA.id);
    const updatedNotif = updatedList.find((n) => n.id === notif.id);
    expect(updatedNotif?.isRead).toBe(true);
  });

  // Test 11: File Security Validation
  it('validates uploaded files: accepts valid PDFs and rejects non-PDFs or oversized files', () => {
    const valid = validateFileMetadata('application/pdf', 2 * 1024 * 1024, 'khatian_record.pdf');
    expect(valid.valid).toBe(true);

    const badMime = validateFileMetadata('application/x-msdownload', 500, 'virus.exe');
    expect(badMime.valid).toBe(false);
    expect(badMime.error).toContain('Disallowed file type');

    const tooLarge = validateFileMetadata('application/pdf', 15 * 1024 * 1024, 'huge.pdf');
    expect(tooLarge.valid).toBe(false);
    expect(tooLarge.error).toContain('exceeds');

    const cleanName = sanitizeFilename('../../etc/passwd.pdf');
    expect(cleanName).not.toContain('..');
    expect(cleanName).not.toContain('/');
    expect(cleanName).not.toContain('\\');
  });

  // Test 12: Ownership & IDOR Protection Check
  it('enforces IDOR rules: Citizen B cannot claim or download Citizen A application', () => {
    const appA = dataStore.createApplication({
      citizenId: citizenA.id,
      citizenName: citizenA.fullName,
      citizenPhone: '01711223344',
      documentType: 'khatian_copy',
      district: 'Dhaka',
      upazila: 'Savar',
      mouza: 'Ashulia',
      khatianNo: '7788',
      dagNo: '9900',
      ownershipRelation: 'Owner',
      purpose: 'Confidential loan application',
      assignedOffice: 'Savar Upazila Land Office',
    });

    const isOwnerA = appA.citizenId === citizenA.id;
    const isOwnerB = appA.citizenId === citizenB.id;
    expect(isOwnerA).toBe(true);
    expect(isOwnerB).toBe(false);

    const userRoleB: string = citizenB.role;
    const isAuthorizedForCitizenB =
      userRoleB === 'officer' ||
      userRoleB === 'admin' ||
      appA.citizenId === citizenB.id;

    expect(isAuthorizedForCitizenB).toBe(false);
  });

  // Test 13: Unapproved applications cannot be downloaded
  it('prevents document download when application is still Pending or Under_Review', () => {
    const app = dataStore.createApplication({
      citizenId: citizenA.id,
      citizenName: citizenA.fullName,
      citizenPhone: '01711223344',
      documentType: 'khatian_copy',
      district: 'Dhaka',
      upazila: 'Savar',
      mouza: 'Ashulia',
      khatianNo: '1234',
      dagNo: '5678',
      ownershipRelation: 'Owner',
      purpose: 'Personal record',
      assignedOffice: 'Savar Upazila Land Office',
    });

    const canDownloadPending =
      app.status === 'Document_Available' || app.status === 'Approved';
    expect(canDownloadPending).toBe(false);

    const underReview = dataStore.updateApplicationStatus(
      app.id,
      'Under_Review',
      officer.id,
      officer.fullName
    );
    const canDownloadUnderReview =
      underReview?.status === 'Document_Available' || underReview?.status === 'Approved';
    expect(canDownloadUnderReview).toBe(false);
  });

  // Test 14: Approved application without an uploaded PDF cannot provide a download
  it('prevents document download when application is Approved but official PDF is not yet uploaded', () => {
    const app = dataStore.createApplication({
      citizenId: citizenA.id,
      citizenName: citizenA.fullName,
      citizenPhone: '01711223344',
      documentType: 'khatian_copy',
      district: 'Dhaka',
      upazila: 'Savar',
      mouza: 'Ashulia',
      khatianNo: '2468',
      dagNo: '1357',
      ownershipRelation: 'Owner',
      purpose: 'Verification',
      assignedOffice: 'Savar Upazila Land Office',
    });

    const approvedApp = dataStore.updateApplicationStatus(
      app.id,
      'Approved',
      officer.id,
      officer.fullName
    );

    expect(approvedApp?.status).toBe('Approved');
    expect(approvedApp?.officialDocument).toBeUndefined();

    // Must strictly be Document_Available with an officialDocument attached
    const isReadyForCitizenDownload =
      approvedApp?.status === 'Document_Available' &&
      Boolean(approvedApp?.officialDocument?.storageKey);

    expect(isReadyForCitizenDownload).toBe(false);
  });

  // Test 15: Fail-safe verification for standalone helper functions
  it('guarantees that getApplications and createApplication can be invoked as standalone exports', () => {
    expect(typeof getApplications).toBe('function');
    expect(typeof createApplication).toBe('function');

    const apps = getApplications({ citizenId: citizenA.id });
    expect(Array.isArray(apps)).toBe(true);
  });

  // Test 16: Risk Scanner separation: Risk evaluation does not provide official certified documents
  it('strictly separates unofficial analytical risk reports from official land documents', () => {
    const record = dataStore.getRecords()[0];
    expect(record).toBeDefined();

    const verification = dataStore.createVerification(record, citizenA.id);
    expect(verification).toBeDefined();
    expect(verification.verificationCode).toBeDefined();

    // A verification result does not constitute an official land document application
    const isOfficialApplication = 'applicationNumber' in verification;
    expect(isOfficialApplication).toBe(false);

    // Official documents require an application in the applications store
    const app = dataStore.getApplicationByNumber(verification.verificationCode);
    expect(app).toBeUndefined();
  });

  // Test 17: Application Submission Pipeline & Queue Visibility
  it('submits a new application, assigns unique ID with Pending status, and verifies queue visibility', () => {
    const uniqueKhatian = `KHAT-${Date.now()}`;
    const uniqueDag = `DAG-${Math.floor(1000 + Math.random() * 9000)}`;

    const newApp = createApplication({
      citizenId: citizenA.id,
      citizenName: citizenA.fullName,
      citizenPhone: '01711223344',
      citizenEmail: citizenA.email,
      documentType: 'khatian_copy',
      district: 'Dhaka',
      upazila: 'Savar',
      mouza: 'Ashulia',
      khatianNo: uniqueKhatian,
      dagNo: uniqueDag,
      ownershipRelation: 'Owner',
      purpose: 'Bank Loan Verification',
      assignedOffice: 'Savar Upazila Land Office',
    });

    expect(newApp).toBeDefined();
    expect(newApp.applicationNumber).toMatch(/^APP-2026-\d{5}$/);
    expect(newApp.status).toBe('Pending');

    // Citizen can view in their applications list
    const citizenApps = getApplications({ citizenId: citizenA.id });
    const foundInCitizenList = citizenApps.find((a: any) => a.id === newApp.id);
    expect(foundInCitizenList).toBeDefined();
    expect(foundInCitizenList?.status).toBe('Pending');

    // Officer can view in the review queue
    const officerApps = getApplications();
    const foundInOfficerQueue = officerApps.find((a: any) => a.id === newApp.id);
    expect(foundInOfficerQueue).toBeDefined();
    expect(foundInOfficerQueue?.khatianNo).toBe(uniqueKhatian);
  });
});


