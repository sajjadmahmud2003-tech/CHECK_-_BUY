import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { getAuthenticatedUser, isAuthorizedToDownloadDocument } from '@/lib/server-auth';
import { dataStore } from '@/lib/data-store';
import { readPrivateDocument, savePrivateDocument } from '@/lib/document-storage';
import { DocumentRecord } from '@/types';

/**
 * Builds a certified land document PDF for downloadable archives
 */
function createCertifiedDocumentPdf(doc: DocumentRecord, officerName: string): Buffer {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Top Banner
  pdf.setFillColor(6, 95, 70); // Emerald GovTech
  pdf.rect(0, 0, 210, 28, 'F');

  // Header Text
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text("GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH", 105, 11, { align: 'center' });
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('MINISTRY OF LAND • DIGITAL LAND ARCHIVES & VERIFICATION REPOSITORY', 105, 17, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('CERTIFIED LAND RECORD COPY — OFFICIAL DECISION SUPPORT', 105, 23, { align: 'center' });

  // Document Title
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text(doc.fileName.replace(/\.pdf$/i, '').replace(/_/g, ' '), 15, 42);

  // Metadata Subtitle
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Tracking ID: ${doc.id}   |   Type: ${doc.documentType.toUpperCase()}   |   Generated: ${new Date().toISOString()}`, 15, 48);

  // Horizontal Rule
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.line(15, 52, 195, 52);

  // Section: Land Property Specification
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(15, 58, 180, 52, 3, 3, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(15, 58, 180, 52, 3, 3, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(6, 95, 70);
  pdf.text('PROPERTY SPECIFICATION & SURVEY IDENTIFICATION', 20, 66);

  pdf.setFontSize(9);
  pdf.setTextColor(51, 65, 85);

  const fields = doc.extractedFields;
  pdf.setFont('helvetica', 'bold');
  pdf.text('District / Zilla:', 20, 75);
  pdf.setFont('helvetica', 'normal');
  pdf.text(fields.district || 'Dhaka', 60, 75);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Upazila / Thana:', 110, 75);
  pdf.setFont('helvetica', 'normal');
  pdf.text(fields.upazila || 'N/A', 150, 75);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Mouza:', 20, 83);
  pdf.setFont('helvetica', 'normal');
  pdf.text(fields.mouza || 'N/A', 60, 83);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Plot / Dag No:', 110, 83);
  pdf.setFont('helvetica', 'normal');
  pdf.text(fields.dagNo ? `#${fields.dagNo}` : 'N/A', 150, 83);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Khatian No:', 20, 91);
  pdf.setFont('helvetica', 'normal');
  pdf.text(fields.khatianNo ? `#${fields.khatianNo}` : 'N/A', 60, 91);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Recorded Area:', 110, 91);
  pdf.setFont('helvetica', 'normal');
  pdf.text(fields.areaDecimals ? `${fields.areaDecimals} Decimals (শতক)` : 'N/A', 150, 91);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Recorded Owner(s):', 20, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text(fields.ownerNames.join(', ') || 'N/A', 60, 99);

  // Section: Verification & Legal Status
  pdf.setFillColor(240, 253, 244);
  pdf.roundedRect(15, 116, 180, 42, 3, 3, 'F');
  pdf.setDrawColor(187, 247, 208);
  pdf.roundedRect(15, 116, 180, 42, 3, 3, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(21, 128, 61);
  pdf.text('LEGAL VERIFICATION & EXTRACTION AUDIT', 20, 124);

  pdf.setFontSize(9);
  pdf.setTextColor(51, 65, 85);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Review Status:', 20, 133);
  pdf.setFont('helvetica', 'normal');
  pdf.text(doc.reviewStatus.toUpperCase(), 60, 133);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Confidence Score:', 110, 133);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${Math.round(fields.confidenceScore * 100)}% (Verified)`, 150, 133);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Authorized By:', 20, 142);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${officerName} (Land Officer / Legal Consultant)`, 60, 142);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Verification Code:', 110, 142);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`BD-GOV-${doc.id.slice(-6).toUpperCase()}`, 150, 142);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Security Clearance:', 20, 150);
  pdf.setFont('helvetica', 'normal');
  pdf.text('RESTRICTED — LAND OFFICER AUTHORIZED ACCESS ONLY', 60, 150);

  // Land Officer Seal & Signature Box
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(15, 166, 180, 50, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text('OFFICIAL ATTESTATION SEAL', 20, 173);

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('This digital copy is an authenticated extract from the CHECK_&_BUY simulation archives.', 20, 180);
  pdf.text('Certified for inspection by authorized Land Officers, Sub-Registrars, and Legal Consultants.', 20, 185);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(6, 95, 70);
  pdf.text(`Attesting Officer: ${officerName}`, 20, 196);
  pdf.text('Office: AC Land Archive & Legal Advisory Directorate, Dhaka', 20, 201);
  pdf.text(`Date of Release: ${new Date().toLocaleDateString('en-GB')}`, 20, 206);

  // Footer Disclaimer
  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Confidential GovTech Land Document • Strictly for Authorized Land Officer Evaluation • Subject to Bangladesh Land Law', 105, 280, { align: 'center' });
  pdf.text('CHECK_&_BUY — Problem Statement P5: Check Before You Buy • Landtech Innovation 2026', 105, 285, { align: 'center' });

  const arrayBuffer = pdf.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Authenticate user from session / authorization header / cookie
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Authentication required to download protected documents.',
        code: 'UNAUTHENTICATED',
      },
      { status: 401 }
    );
  }

  // 2. Strict Role Verification: ONLY 'officer' (Land Officer) is allowed
  const authCheck = isAuthorizedToDownloadDocument(user);
  if (!authCheck.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: authCheck.reason || 'Forbidden: Document downloads are restricted to Land Officers.',
        code: 'ROLE_FORBIDDEN',
        userRole: user.role,
      },
      { status: 403 }
    );
  }

  // 3. Find document in data store
  const doc = dataStore.getDocuments().find((d) => d.id === id);
  if (!doc) {
    return NextResponse.json(
      {
        success: false,
        error: `Document with ID '${id}' was not found.`,
        code: 'DOCUMENT_NOT_FOUND',
      },
      { status: 404 }
    );
  }

  // 4. Retrieve from private server storage, or generate and store certified PDF
  let fileBuffer: Buffer;
  try {
    const stored = await readPrivateDocument(doc.fileName);
    fileBuffer = stored.buffer;
  } catch {
    // Generate certified PDF buffer and cache in private storage
    fileBuffer = createCertifiedDocumentPdf(doc, user.fullName || 'Authorized Land Officer');
    try {
      await savePrivateDocument(fileBuffer, doc.fileName, doc.mimeType || 'application/pdf');
    } catch {
      // Storage directory may already contain file or ephemeral
    }
  }

  // 5. Audit Log Entry
  dataStore.logAction(
    'DOWNLOAD_LAND_DOCUMENT',
    'document',
    doc.id,
    `Land Officer ${user.fullName} (${user.email}) downloaded certified document ${doc.fileName}`,
    user.id
  );

  // 6. Return secure attachment response
  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      'Content-Type': doc.mimeType || 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
      'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
