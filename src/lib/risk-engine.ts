import { LandRecord, RiskFinding, VerificationResult, RiskSeverity } from '@/types';

export function analyzeLandRecordRisks(record: LandRecord): VerificationResult {
  const findings: RiskFinding[] = [];
  let riskScore = 10; // baseline base score

  // 1. Check Ownership Conflicts or Multiple Claimants
  if (record.owners.length > 1) {
    const hasDisputeKeywords = record.owners.some(o => 
      o.ownerName.toLowerCase().includes('dispute') || 
      o.ownerName.toLowerCase().includes('claimant') ||
      o.ownerNameBn.includes('দাবিকৃত')
    );
    if (hasDisputeKeywords) {
      findings.push({
        id: 'risk-own-conflict',
        category: 'ownership',
        severity: 'high',
        ruleCode: 'RULE-OWN-01',
        titleEn: 'Conflicting Ownership Claims Detected',
        titleBn: 'পরস্পরবিরোধী মালিকানার দাবি চিহ্নিত',
        reasonEn: 'Multiple parties have registered conflicting ownership interests or title contestations on this Dag/Plot.',
        reasonBn: 'এই দাগে একাধিক ব্যক্তি স্বত্ব বা অংশীদারিত্বের দাবিদার হিসেবে রেকর্ডে পরিলক্ষিত হয়েছেন।',
        evidence: `Multiple claimants listed in registry: ${record.owners.map(o => o.ownerName).join(', ')}`,
        evidenceBn: `তালিকাভুক্ত অংশীদার: ${record.owners.map(o => o.ownerNameBn).join(', ')}`,
        recommendedStepsEn: 'Do not pay any advance. Request a certified Non-Encumbrance Certificate (NEC) and examine title deeds at the Sub-Registry office.',
        recommendedStepsBn: 'কোনো বায়না করবেন না। সাব-রেজিস্ট্রি অফিস থেকে নির্দায় সনদ (NEC) এবং বায়া দলিলের সহি মহুরি নকল যাচাই করুন।',
      });
      riskScore += 35;
    }
  }

  // 2. Check Area Discrepancy across Surveys (CS -> SA -> RS -> BS)
  const validSurveys = record.surveys.filter(s => s.areaDecimals > 0);
  if (validSurveys.length >= 2) {
    const areas = validSurveys.map(s => s.areaDecimals);
    const minArea = Math.min(...areas);
    const maxArea = Math.max(...areas);
    const diff = maxArea - minArea;
    const percentageVariance = (diff / minArea) * 100;

    if (percentageVariance > 10) {
      findings.push({
        id: 'risk-area-variance',
        category: 'area',
        severity: percentageVariance > 25 ? 'high' : 'medium',
        ruleCode: 'RULE-AREA-02',
        titleEn: `Significant Area Variance (${diff.toFixed(1)} Decimals / ${percentageVariance.toFixed(0)}%)`,
        titleBn: `জরিপে জমির পরিমাণের বড় তারতম্য (${diff.toFixed(1)} শতাংশ / ${percentageVariance.toFixed(0)}%)`,
        reasonEn: `The recorded land area increased or decreased by ${percentageVariance.toFixed(0)}% between historical surveys without recorded land purchase deeds.`,
        reasonBn: `ঐতিহাসিক বিভিন্ন জরিপের মধ্যে জমির পরিমাপে ${percentageVariance.toFixed(0)}% ব্যবধান পরিলক্ষিত হয়েছে।`,
        evidence: `Min area: ${minArea} dec across surveys, Max area recorded: ${maxArea} dec in current survey.`,
        evidenceBn: `পূর্বতন জরিপে সর্বনিম্ন: ${minArea} শতক, বর্তমান জরিপে রেকর্ডকৃত: ${maxArea} শতক।`,
        recommendedStepsEn: 'Conduct a physical ground boundary survey (মৌজা নকশা মিলানো) with a certified Amin to confirm physical possession.',
        recommendedStepsBn: 'সরকারি সনদপ্রাপ্ত সার্ভেয়ার/আমিন দ্বারা মৌজা নকশার সাথে বাস্তবের দাগ ও সীমানা মেপে জমি দখল নিশ্চিত করুন।',
      });
      riskScore += percentageVariance > 25 ? 30 : 20;
    }
  }

  // 3. Check Historical Survey Chain Continuity (CS -> SA -> RS -> BS)
  const missingSurveys = record.surveys.filter(s => s.verifiedStatus === 'missing');
  if (missingSurveys.length > 0) {
    findings.push({
      id: 'risk-chain-gap',
      category: 'historical_chain',
      severity: 'medium',
      ruleCode: 'RULE-CHAIN-03',
      titleEn: `Gap in Historical Chain of Title (${missingSurveys.map(s => s.surveyType).join(', ')})`,
      titleBn: `জরিপ ধারাবাহিকতায় ঘাটতি (${missingSurveys.map(s => s.surveyType).join(', ')} জরিপ অনুপস্থিত)`,
      reasonEn: `One or more historical survey records could not be traced or are torn/missing from district archives.`,
      reasonBn: `জেলা রেকর্ড রুমে এক বা একাধিক জরিপের খতিয়ান পৃষ্ঠা ক্ষতিগ্রস্ত বা অনুপস্থিত রয়েছে।`,
      evidence: `Missing survey stages: ${missingSurveys.map(s => s.surveyType).join(', ')}`,
      evidenceBn: `অনুপস্থিত জরিপ রেকর্ড: ${missingSurveys.map(s => s.surveyType).join(', ')}`,
      recommendedStepsEn: 'Apply for certified copies from the District Record Room (কালেক্টরেট রেকর্ড রুম) to verify continuous title before 1972.',
      recommendedStepsBn: 'জেলা প্রশাসকের কার্যালয়ের রেকর্ড রুম থেকে সার্টিফাইড পর্চা উত্তোলন করে মূল মালিকানা শৃঙ্খল নিশ্চিত করুন।',
    });
    riskScore += 20;
  }

  // 4. Check Mutation (খারিজ) Status
  if (!record.mutation) {
    findings.push({
      id: 'risk-mut-missing',
      category: 'mutation',
      severity: 'high',
      ruleCode: 'RULE-MUT-04',
      titleEn: 'No Mutation (নামজারি) Record Found in Seller\'s Name',
      titleBn: 'বিক্রেতার নামে কোনো নামজারি (খারিজ) রেকর্ড পাওয়া যায়নি',
      reasonEn: 'Land title is not officially mutated in the AC Land e-Mutation register. You cannot legally pay rent/tax without mutation.',
      reasonBn: 'এসিল্যান্ড অফিসে বিক্রেতার নামে নামজারি বা নতুন জোত সৃষ্টি হয়নি। নামজারিবিহীন জমি কেনা অত্যন্ত ঝুঁকিপূর্ণ।',
      evidence: 'No Mutation case or DCR reference attached to this record.',
      evidenceBn: 'রেকর্ডে কোনো নামজারি কেস বা ডিসিআর নম্বর পাওয়া যায়নি।',
      recommendedStepsEn: 'Require the seller to complete e-Mutation and obtain DCR receipt & holding number before executing the deed.',
      recommendedStepsBn: 'বিক্রেতাকে অবিলম্বে এসিল্যান্ড অফিস থেকে ই-নামজারি সম্পন্ন করে ডিসিআর ও খাজনার দাখিলা প্রদর্শনের নির্দেশ দিন।',
    });
    riskScore += 30;
  } else if (record.mutation.status === 'rejected') {
    findings.push({
      id: 'risk-mut-rejected',
      category: 'mutation',
      severity: 'high',
      ruleCode: 'RULE-MUT-05',
      titleEn: 'Mutation Application Was Rejected by AC Land',
      titleBn: 'এসিল্যান্ড অফিস কর্তৃক নামজারি আবেদন বাতিলকৃত',
      reasonEn: `Mutation was denied: ${record.mutation.remarks || 'Irregularity found in supporting deeds'}`,
      reasonBn: `নামজারি বাতিল হওয়ার কারণ: ${record.mutation.remarks || 'প্রয়োজনীয় বায়া দলিলে ত্রুটি রয়েছে'}`,
      evidence: `Case No: ${record.mutation.caseNo}, Status: Rejected`,
      evidenceBn: `কেস নম্বর: ${record.mutation.caseNo}, অবস্থা: বাতিল`,
      recommendedStepsEn: 'Investigate the rejection reason at the local Upazila Land Office before proceeding with any financial agreement.',
      recommendedStepsBn: 'সংশ্লিষ্ট উপজেলা ভূমি অফিসে যোগাযোগ করে নামজারি বাতিলের কারণ বিস্তারিতভাবে জানুন।',
    });
    riskScore += 35;
  } else if (record.mutation.status === 'inconsistent' || record.mutation.status === 'pending') {
    findings.push({
      id: 'risk-mut-pending',
      category: 'mutation',
      severity: 'medium',
      ruleCode: 'RULE-MUT-06',
      titleEn: 'Mutation is Pending / Inconsistent Review',
      titleBn: 'নামজারি প্রক্রিয়াধীন অথবা অসঙ্গতিপূর্ণ অবস্থায় রয়েছে',
      reasonEn: 'Mutation is not fully finalized or remarks were flagged during AC Land field review.',
      reasonBn: 'নামজারি প্রক্রিয়া এখনো চূড়ান্তভাবে সম্পন্ন হয়নি অথবা ভূমি সহকারী কর্মকর্তার প্রতিবেদনে শর্ত জুড়ে দেওয়া হয়েছে।',
      evidence: `Case No: ${record.mutation.caseNo}, Status: ${record.mutation.status}`,
      evidenceBn: `কেস নম্বর: ${record.mutation.caseNo}, অবস্থা: ${record.mutation.status === 'pending' ? 'চলমান' : 'অসঙ্গতিপূর্ণ'}`,
      recommendedStepsEn: 'Wait until the final DCR is issued and Mutation Khatian is printed before paying purchase consideration.',
      recommendedStepsBn: 'নামজারি খতিয়ান চূড়ান্ত হওয়া এবং ডিসিআর রসিদ না পাওয়া পর্যন্ত ক্রয়মূল্য পরিশোধ করা থেকে বিরত থাকুন।',
    });
    riskScore += 15;
  }

  // 5. Check Legal Caveat / Civil Court Dispute
  if (record.hasCaveatOrDispute) {
    findings.push({
      id: 'risk-legal-caveat',
      category: 'legal_dispute',
      severity: 'high',
      ruleCode: 'RULE-DISPUTE-07',
      titleEn: 'Active Legal Caveat / Government Injunction Flagged',
      titleBn: 'আইনি নিষেধাজ্ঞা বা সরকারি অধিগ্রহণ সতর্কতা পরিলক্ষিত',
      reasonEn: record.disputeDetails || 'Notice of civil suit or road alignment buffer registered on plot.',
      reasonBn: record.disputeDetailsBn || 'উক্ত দাগে দেওয়ানি মামলা বা সরকারি অধিগ্রহণের নোটিশ রয়েছে।',
      evidence: `Caveat record on Dag ${record.dagNo}: ${record.disputeDetails || 'Notice flagged'}`,
      evidenceBn: `দাগ ${record.dagNo}-এ নিষেধাজ্ঞা: ${record.disputeDetailsBn || 'সতর্কতা চিহ্নিত'}`,
      recommendedStepsEn: 'Consult a High Court/District Bar advocate to review court docket numbers and verify if an injunction (স্থিতাবস্থা) is in effect.',
      recommendedStepsBn: 'জেলা বা হাইকোর্ট বারের আইনজীবীর মাধ্যমে আদালতের মামলা এবং স্থিতাবস্থার আদেশ যাচাই করুন।',
    });
    riskScore += 35;
  }

  // 6. Check Land Development Tax Compliance (খাজনা পরিশোধ)
  if (record.mutation?.lastTaxPaidYear) {
    const currentYear = new Date().getFullYear();
    const unpaidYears = currentYear - record.mutation.lastTaxPaidYear;
    if (unpaidYears >= 3) {
      findings.push({
        id: 'risk-tax-arrears',
        category: 'tax_compliance',
        severity: 'low',
        ruleCode: 'RULE-TAX-08',
        titleEn: `Land Development Tax Unpaid for ${unpaidYears} Years`,
        titleBn: `বিগত ${unpaidYears} বছর ধরে ভূমি উন্নয়ন কর (খাজনা) অপরিশোধিত`,
        reasonEn: `Last tax paid in ${record.mutation.lastTaxPaidYear}. Overdue dues accrue interest and could indicate absentee ownership.`,
        reasonBn: `সর্বশেষ ${record.mutation.lastTaxPaidYear} সালে খাজনা পরিশোধ করা হয়েছে। দীর্ঘদিনের বকেয়া খাজনা জটিলতা সৃষ্টি করতে পারে।`,
        evidence: `Last paid year: ${record.mutation.lastTaxPaidYear}, Current year: ${currentYear}`,
        evidenceBn: `সর্বশেষ পরিশোধ: ${record.mutation.lastTaxPaidYear}, বর্তমান সাল: ${currentYear}`,
        recommendedStepsEn: 'Request the seller to pay all outstanding Land Development Tax online via ld-tax portal and provide the updated Dakhila.',
        recommendedStepsBn: 'ভূমি উন্নয়ন কর পোর্টালে (ldtax.gov.bd) বকেয়া খাজনা পরিশোধ করে হালনাগাদ দাখিলা জমা দিতে বলুন।',
      });
      riskScore += 10;
    }
  }

  // Cap risk score between 5 and 95
  const normalizedScore = Math.min(Math.max(riskScore, 5), 98);

  // Determine Severity Level
  let overallLevel: RiskSeverity = 'low';
  if (normalizedScore >= 65 || findings.some(f => f.severity === 'high')) {
    overallLevel = 'high';
  } else if (normalizedScore >= 35 || findings.some(f => f.severity === 'medium')) {
    overallLevel = 'medium';
  }

  // Summaries
  let summaryEn = 'Records indicate consistent historical continuity with no critical title red flags found.';
  let summaryBn = 'উপলব্ধ রেকর্ডে মালিকানার ধারাবাহিকতা বজায় রয়েছে এবং কোনো বড় ধরনের আইনি বাধা পাওয়া যায়নি।';

  if (overallLevel === 'high') {
    summaryEn = `HIGH PRIORITY REVIEW: ${findings.filter(f => f.severity === 'high').length} high-risk finding(s) detected. Exercising caution is strongly advised before entering any contract.`;
    summaryBn = `জরুরি পর্যালোচনা প্রয়োজন: রেকর্ডে ${findings.filter(f => f.severity === 'high').length}টি উচ্চ ঝুঁকিপূর্ণ অসঙ্গতি বা আইনি বাধা চিহ্নিত হয়েছে। কোনো ধরনের চুক্তি বা অর্থ লেনদেনের পূর্বে সতর্ক হন।`;
  } else if (overallLevel === 'medium') {
    summaryEn = `NEEDS REVIEW: ${findings.length} warning(s) identified in survey continuity, mutation, or area records that require verification.`;
    summaryBn = `পর্যালোচনা প্রয়োজন: জরিপের ধারাবাহিকতা বা নামজারি সংক্রান্ত রেকর্ডে ${findings.length}টি অসঙ্গতি চিহ্নিত হয়েছে যা সরকারি অফিসে যাচাই করা আবশ্যক।`;
  }

  const buyerChecklistEn = [
    'Verify physical on-ground boundary possession with a local Amin matching Mouza map.',
    'Inspect original Kabala title deeds and link deeds (বায়া দলিল) for at least 25-30 years.',
    'Check Upazila Land Office to verify genuine Mutation Khatian and DCR receipt.',
    'Obtain certified Non-Encumbrance Certificate (NEC) from Sub-Registry office.',
    'Check with local Union/Pourashava Land Office to ensure land is not Govt Khas or Vested property.'
  ];

  const buyerChecklistBn = [
    'মৌজা নকশা অনুযায়ী সরকার অনুমোদিত আমিন দ্বারা সরেজমিনে দাগ ও সীমানা দখল যাচাই করুন।',
    'কমপক্ষে ২৫-৩০ বছরের মূল বায়া দলিলের ধারাবাহিকতা সাব-রেজিস্ট্রি ভলিউমে মিলিয়ে দেখুন।',
    'উপজেলা সহকারী কমিশনার (ভূমি) অফিস থেকে মূল নামজারি খতিয়ান ও ডিসিআর রসিদ যাচাই করুন।',
    'সাব-রেজিস্ট্রি অফিস থেকে নির্দায় সনদ (NEC) গ্রহণ করে কোনো গোপন বন্ধক আছে কি না দেখুন।',
    'স্থানীয় ভূমি অফিসে গিয়ে নিশ্চিত হোন যে জমিটি অর্পিত সম্পত্তি, পরিত্যক্ত বা খাস খতিয়ানভুক্ত নয়।'
  ];

  const verificationCode = `LC-${record.district.substring(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  return {
    id: `ver-${record.id}-${Date.now()}`,
    verificationCode,
    landRecordId: record.id,
    landRecord: record,
    createdAt: new Date().toISOString(),
    overallScore: normalizedScore,
    overallLevel,
    findings,
    summaryEn,
    summaryBn,
    buyerChecklistEn,
    buyerChecklistBn,
    disclaimerEn: 'Notice: This verification is a rule-based pre-screening assessment built for the Landtech Innovation Hackathon 2026. It highlights inconsistencies between available records and is not an official judicial guarantee of title.',
    disclaimerBn: 'বিজ্ঞপ্তি: এই প্রতিবেদনটি ল্যান্ডটেক ইনোভেশন হ্যাকাথন ২০২৬-এর জন্য তৈরি একটি প্রাথমিক সিদ্ধান্ত সহায়ক স্ক্রিনিং ফলাফল। এটি কোনো সরকারি চূড়ান্ত মালিকানা সনদ বা আদালতের রায় নয়।',
  };
}
