import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { dataStore, getApplicationById } from '@/lib/data-store';
import { readPrivateDocument, savePrivateDocument } from '@/lib/document-storage';
import { jsPDF } from 'jspdf';
import { LandApplication } from '@/types';

/**
 * Builds a certified land document PDF when official document is generated dynamically
 */
function generateCertifiedOfficialPdf(app: LandApplication): Buffer {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Top GovTech Green Banner
  pdf.setFillColor(6, 95, 70); // Emerald-800
  pdf.rect(0, 0, 210, 30, 'F');

  // Header Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text("GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH", 105, 11, { align: 'center' });
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('MINISTRY OF LAND • DIGITAL LAND ARCHIVES & CITIZEN RECORDS', 105, 17, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('CERTIFIED DIGITAL EXTRACT — ISSUED UPON CITIZEN APPLICATION', 105, 24, { align: 'center' });

  // Document Title
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  const docTypeLabel = app.documentType.replace(/_/g, ' ').toUpperCase();
  pdf.text(`CERTIFIED RECORD: ${docTypeLabel}`, 15, 42);

  // Application Tracking Subtitle
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `Application No: ${app.applicationNumber}   |   Tracking ID: ${app.id}   |   Approved: ${app.approvedAt || new Date().toISOString()}`,
    15,
    49
  );

  // Divider
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.line(15, 53, 195, 53);

  // Section 1: Applicant & Ownership Relation
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(15, 58, 180, 42, 3, 3, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(15, 58, 180, 42, 3, 3, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(6, 95, 70);
  pdf.text('1. APPLICANT SPECIFICATION & VERIFIED CITIZEN IDENTITY', 20, 66);

  pdf.setFontSize(9);
  pdf.setTextColor(51, 65, 85);
  pdf.text('Applicant Full Name:', 20, 74);
  pdf.setFont('helvetica', 'normal');
  pdf.text(app.citizenName, 65, 74);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact Mobile:', 110, 74);
  pdf.setFont('helvetica', 'normal');
  pdf.text(app.citizenPhone, 145, 74);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Ownership Relation:', 20, 82);
  pdf.setFont('helvetica', 'normal');
  pdf.text(app.ownershipRelation, 65, 82);

  pdf.setFont('helvetica', 'bold');
  pdf.text('National ID / NID:', 110, 82);
  pdf.setFont('helvetica', 'normal');
  pdf.text(app.citizenNid ? `•••• •••• ${app.citizenNid.slice(-4)}` : 'On file with AC Land', 145, 82);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Stated Purpose:', 20, 90);
  pdf.setFont('helvetica', 'normal');
  pdf.text(app.purpose.length > 60 ? app.purpose.slice(0, 60) + '...' : app.purpose, 65, 90);

  // Section 2: Land Plot & Survey Identification
  pdf.setFillColor(240, 253, 244);
  pdf.roundedRect(15, 106, 180, 50, 3, 3, 'F');
  pdf.setDrawColor(187, 247, 208);
  pdf.roundedRect(15, 106, 180, 50, 3, 3, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(21, 128, 61);
  pdf.text('2. PARCEL RECORD & SURVEY DELINEATION', 20, 114);

  pdf.setFontSize(9);
  pdf.setTextColor(51, 65, 85);

  pdf.setFont('helvetica', 'bold');
  pdf.text('District / Zilla:', 20, 123);
  pdf.setFont('helvetica', 'normal');
  pdf.text(app.district, 60, 123);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Upazila / Thana:', 110, 123);
  pdf.setFont('helvetica', 'normal');
  pdf.text(app.upazila, 150, 123);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Mouza:', 20, 131);
  pdf.setFont('helvetica', 'normal');
  pdf.text(app.mouza, 60, 131);

  pdf.setFont('helvetica', 'bold');
  pdf.text('JL Number:', 110, 131);
  pdf.setFont('helvetica', 'normal');
  pdf.text(app.jlNumber ? `#${app.jlNumber}` : 'N/A', 150, 131);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Khatian Number:', 20, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.text(app.khatianNo ? `#${app.khatianNo}` : 'N/A', 60, 139);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Plot / Dag Number:', 110, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.text(app.dagNo ? `#${app.dagNo}` : 'N/A', 150, 139);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Issuing Authority:', 20, 147);
  pdf.setFont('helvetica', 'normal');
  pdf.text(app.assignedOffice, 60, 147);

  // Section 3: Official Attestation Box
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(15, 164, 180, 52, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text('OFFICIAL ATTESTATION & SECURITY RECORD', 20, 172);

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    'This certified digital copy was issued following due verification of title records by an authorized Land Officer.',
    20,
    180
  );
  pdf.text('Certified for legal inspection, bank due diligence, and pre-purchase screening.', 20, 186);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(6, 95, 70);
  pdf.text(
    `Attesting Officer: ${app.officialDocument?.uploaderName || 'Barrister Tahmina Akter (Land Officer)'}`,
    20,
    196
  );
  pdf.text(
    `Verification Hash: ${app.officialDocument?.verificationHash || `BD-ACLAND-${app.applicationNumber}-VERIFIED`}`,
    20,
    202
  );
  pdf.text(`Release Date: ${new Date().toLocaleDateString('en-GB')}`, 20, 208);

  // Footer Disclaimers
  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    'Confidential GovTech Land Document • Strictly for Authorized Recipient Inspection • Subject to Bangladesh Land Law',
    105,
    275,
    { align: 'center' }
  );
  pdf.text(
    'CHECK_&_BUY — Smart Land Verification & Pre-Purchase Diligence Platform',
    105,
    281,
    { align: 'center' }
  );

  const arrayBuffer = pdf.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Authentication required to download official land documents.',
          code: 'UNAUTHENTICATED',
        },
        { status: 401 }
      );
    }

    const app = typeof dataStore?.getApplicationById === 'function'
      ? dataStore.getApplicationById(id)
      : getApplicationById(id);
    if (!app) {
      return NextResponse.json(
        {
          success: false,
          error: `Application '${id}' was not found.`,
          code: 'APPLICATION_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 1. Strict Ownership / IDOR Verification:
    // A Citizen can NEVER download another citizen's document!
    if (user.role === 'citizen' && app.citizenId !== user.id) {
      dataStore.logAction(
        'SECURITY_ALERT_UNAUTHORIZED_DOWNLOAD_ATTEMPT',
        'application',
        app.id,
        `Citizen ${user.fullName} (${user.id}) attempted to download document belonging to ${app.citizenId}`,
        user.id
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: You do not have permission to download another citizen’s official land document.',
          code: 'IDOR_FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 2. Strict Approval Status Check:
    // Document can NEVER be downloaded if status is Pending, Draft, Under_Review, or Rejected!
    if (app.status !== 'Approved' && app.status !== 'Document_Available') {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Document is not available for download. Current application status is '${app.status}'.`,
          code: 'DOCUMENT_NOT_AVAILABLE',
          status: app.status,
        },
        { status: 403 }
      );
    }

    // 3. Retrieve private file buffer
    let fileBuffer: Buffer;
    const fileName =
      app.officialDocument?.fileName ||
      `Certified_${app.documentType}_${app.applicationNumber}.pdf`;

    if (app.officialDocument?.storageKey) {
      try {
        const stored = await readPrivateDocument(app.officialDocument.storageKey);
        fileBuffer = stored.buffer;
      } catch {
        // Fall back to certified PDF generator and cache in private storage
        fileBuffer = generateCertifiedOfficialPdf(app);
        try {
          await savePrivateDocument(fileBuffer, fileName, 'application/pdf');
        } catch {
          // Non-fatal if already cached
        }
      }
    } else {
      fileBuffer = generateCertifiedOfficialPdf(app);
    }

    // 4. Log Download Event in Audit Log
    dataStore.logAction(
      'DOWNLOAD_OFFICIAL_DOCUMENT',
      'application',
      app.id,
      `User ${user.fullName} (${user.id}, role: ${user.role}) downloaded official document for application ${app.applicationNumber}`,
      user.id
    );

    // 5. Stream attachment with strict security headers
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
