import { jsPDF } from 'jspdf';
import { VerificationResult, Language } from '@/types';
import { formatDate } from './bangla-utils';

export function generateVerificationPdf(
  verification: VerificationResult,
  lang: Language = 'en'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const record = verification.landRecord;
  const isEn = lang === 'en';

  // Palette
  const primaryGreen = [6, 95, 70]; // #065f46
  const darkSlate = [15, 23, 42]; // #0f172a
  const amber = [217, 119, 6];
  const red = [220, 38, 38];
  const gray = [100, 116, 139];

  // Header Banner
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, 0, 210, 26, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LANDCHECK AI — CITIZEN PRE-PURCHASE VERIFICATION DOSSIER', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    'Landtech Innovation Hackathon 2026 • Problem Statement P5: Check Before You Buy',
    14,
    18
  );

  // Verification Meta Box
  let y = 34;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 24, 2, 2, 'FD');

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`VERIFICATION CODE: ${verification.verificationCode}`, 18, y + 7);
  doc.text(`DATE GENERATED: ${formatDate(verification.createdAt, 'en')}`, 18, y + 14);

  // Risk Level Badge
  const badgeColor =
    verification.overallLevel === 'high'
      ? red
      : verification.overallLevel === 'medium'
      ? amber
      : primaryGreen;
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(130, y + 4, 60, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(
    `OVERALL STATUS: ${verification.overallLevel.toUpperCase()} RISK (${verification.overallScore}/100)`,
    134,
    y + 12
  );

  y += 30;

  // Property Particulars
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. PROPERTY IDENTIFICATION & SURVEY REFERENCE', 14, y);
  y += 5;

  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, 196, y);
  y += 6;

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const loc = record
    ? `${record.mouza}, Upazila: ${record.upazila}, District: ${record.district}`
    : 'Simulated Record';
  doc.text(`Location: ${loc}`, 14, y);
  y += 5;

  if (record) {
    doc.text(
      `Current Survey: ${record.currentSurvey}  |  Khatian No: ${record.khatianNo}  |  Dag No: ${record.dagNo}  |  Recorded Area: ${record.areaDecimals} Decimals`,
      14,
      y
    );
    y += 5;
    doc.text(
      `Recorded Owner: ${record.owners.map((o) => o.ownerName).join(', ')}  |  Acquisition: ${record.owners[0]?.acquisitionType || 'N/A'}`,
      14,
      y
    );
    y += 5;
    doc.text(
      `Mutation Status: ${record.mutation?.status.toUpperCase() || 'NO MUTATION RECORD'}  |  AC Land Office: ${record.mutation?.acLandOffice || 'N/A'}`,
      14,
      y
    );
    y += 7;
  }

  // Survey Chain Summary
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. HISTORICAL CHAIN CONTINUITY (CS -> SA -> RS -> BS)', 14, y);
  y += 5;
  doc.line(14, y, 196, y);
  y += 5;

  if (record?.surveys) {
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 6, 'F');
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Survey', 16, y + 4);
    doc.text('Year', 35, y + 4);
    doc.text('Khatian', 52, y + 4);
    doc.text('Dag', 72, y + 4);
    doc.text('Area (Dec)', 92, y + 4);
    doc.text('Recorded Owner', 120, y + 4);
    doc.text('Chain Status', 165, y + 4);
    y += 7;

    doc.setFont('helvetica', 'normal');
    record.surveys.forEach((s) => {
      doc.text(s.surveyType, 16, y + 4);
      doc.text(`${s.year}`, 35, y + 4);
      doc.text(s.khatianNo, 52, y + 4);
      doc.text(s.dagNo, 72, y + 4);
      doc.text(`${s.areaDecimals}`, 92, y + 4);
      doc.text(s.recordedOwner.substring(0, 24), 120, y + 4);
      doc.text(s.verifiedStatus.toUpperCase(), 165, y + 4);
      y += 6;
    });
    y += 4;
  }

  // Risk Findings
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('3. RISK SCREENING FINDINGS & RED FLAGS', 14, y);
  y += 5;
  doc.line(14, y, 196, y);
  y += 6;

  if (verification.findings.length === 0) {
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.setFont('helvetica', 'italic');
    doc.text('No critical ownership discrepancies or caveats detected in registry.', 14, y);
    y += 6;
  } else {
    verification.findings.forEach((finding, idx) => {
      const fColor =
        finding.severity === 'high' ? red : finding.severity === 'medium' ? amber : primaryGreen;
      doc.setFillColor(fColor[0], fColor[1], fColor[2]);
      doc.circle(17, y - 1, 1.5, 'F');

      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(
        `[${finding.severity.toUpperCase()}] ${finding.ruleCode}: ${finding.titleEn}`,
        22,
        y
      );
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Reason: ${finding.reasonEn.substring(0, 110)}`, 22, y);
      y += 4;
      doc.text(`Evidence: ${finding.evidence.substring(0, 110)}`, 22, y);
      y += 4;
      doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
      doc.text(`Action: ${finding.recommendedStepsEn.substring(0, 110)}`, 22, y);
      y += 6;
    });
  }

  // Recommended Next Steps Box
  y += 2;
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('4. ESSENTIAL BUYER ACTION CHECKLIST', 14, y);
  y += 5;
  doc.line(14, y, 196, y);
  y += 5;

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  verification.buyerChecklistEn.forEach((item) => {
    doc.text(`[ ] ${item}`, 14, y);
    y += 4;
  });

  // Footer / Disclaimer
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 272, 196, 272);
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('MANDATORY LEGAL DISCLAIMER & PROVENANCE NOTICE:', 14, 276);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'This report is generated by LandCheck AI for hackathon demonstration. It is an automated risk screening tool and NOT',
    14,
    279
  );
  doc.text(
    'an official government title certificate or judicial decree. Buyers must conduct on-ground survey and consult legal counsel.',
    14,
    282
  );

  // Trigger download
  doc.save(`LandCheck-Report-${verification.verificationCode}.pdf`);
}
