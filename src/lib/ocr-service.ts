import { ExtractedDocumentFields } from '@/types';
import { toEnglishNumber } from './bangla-utils';

export function parseBanglaLandText(rawText: string): ExtractedDocumentFields {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = rawText;

  // Extracted fields container
  const fieldConfidence: Record<string, number> = {
    dagNo: 0.6,
    khatianNo: 0.6,
    areaDecimals: 0.5,
    mouza: 0.5,
    ownerNames: 0.7,
  };

  let extractedDag: string | undefined;
  let extractedKhatian: string | undefined;
  let extractedArea: number | undefined;
  let extractedMouza: string | undefined;
  let extractedDeedNo: string | undefined;
  const extractedOwners: string[] = [];

  // 1. Dag number matching (দাগ নং / Dag No / দাগ:)
  const dagMatch = fullText.match(/(?:দাগ\s*(?:নং|নম্বর|:)?|dag\s*(?:no|num)?[:\s]*)\s*([০-৯0-9]+)/i);
  if (dagMatch && dagMatch[1]) {
    extractedDag = toEnglishNumber(dagMatch[1]);
    fieldConfidence.dagNo = 0.92;
  }

  // 2. Khatian number matching (খতিয়ান নং / Khatian No)
  const khatianMatch = fullText.match(/(?:খতিয়ান\s*(?:নং|নম্বর|:)?|khatian\s*(?:no|num)?[:\s]*)\s*([০-৯0-9]+(?:\/[০-৯0-9]+)?)/i);
  if (khatianMatch && khatianMatch[1]) {
    extractedKhatian = toEnglishNumber(khatianMatch[1]);
    fieldConfidence.khatianNo = 0.88;
  }

  // 3. Area matching (শতাংশ / ডেসিমাল / কাঠা / একর)
  const areaMatch = fullText.match(/([০-৯0-9]+(?:\.[০-৯0-9]+)?)\s*(?:শতাংশ|ডেসিমাল|শতক|decimals?)/i);
  if (areaMatch && areaMatch[1]) {
    const parsedArea = parseFloat(toEnglishNumber(areaMatch[1]));
    if (!isNaN(parsedArea)) {
      extractedArea = parsedArea;
      fieldConfidence.areaDecimals = 0.9;
    }
  }

  // 4. Mouza matching (মৌজা / Mouza)
  const mouzaMatch = fullText.match(/(?:মৌজা|mouza)[:\s]*([^\n,।]+)/i);
  if (mouzaMatch && mouzaMatch[1]) {
    extractedMouza = mouzaMatch[1].trim();
    fieldConfidence.mouza = 0.85;
  }

  // 5. Deed No matching (দলিল নং / Deed No)
  const deedMatch = fullText.match(/(?:দলিল\s*(?:নং|নম্বর)?|deed\s*(?:no|num)?)[:\s]*([০-৯0-9]+)/i);
  if (deedMatch && deedMatch[1]) {
    extractedDeedNo = toEnglishNumber(deedMatch[1]);
  }

  // 6. Owner / Buyer names (ক্রেতা / গ্রহীতা / মালিক / নাম:)
  const ownerMatch = fullText.match(/(?:মালিক|গ্রহীতা|ক্রেতা|নাম)[:\s]*([^\n,।]+)/i);
  if (ownerMatch && ownerMatch[1]) {
    const name = ownerMatch[1].trim();
    if (name.length > 3) {
      extractedOwners.push(name);
      fieldConfidence.ownerNames = 0.82;
    }
  }

  // Overall confidence
  const confValues = Object.values(fieldConfidence);
  const avgConfidence = confValues.reduce((a, b) => a + b, 0) / confValues.length;

  return {
    dagNo: extractedDag,
    khatianNo: extractedKhatian,
    areaDecimals: extractedArea,
    mouza: extractedMouza,
    deedNo: extractedDeedNo,
    ownerNames: extractedOwners,
    confidenceScore: parseFloat(avgConfidence.toFixed(2)),
    fieldConfidence,
  };
}

// Sample presets for instant realistic testing
export const DEMO_DOCUMENTS = [
  {
    nameEn: 'Sub-Registry Deed (Gulshan Dag 1204)',
    nameBn: 'রেজিস্ট্রি সাফ-কবলা দলিল (গুলশান দাগ ১২০৪)',
    rawText: `গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
সাব-রেজিস্ট্রি অফিস, গুলশান, ঢাকা।
দলিল নং: ৪১০২/২০১৬
তারিখ: ০২/১১/২০১৬

সম্পত্তির তফসিল:
জেলা: ঢাকা, থানা: গুলশান, মৌজা: গুলশান মডেল টাউন, জে.এল নং: ১১৮।
খতিয়ান নং: ৫৪২ (বিএস)
দাগ নং: ১২০৪
জমির শ্রেণি: বাণিজ্যিক ও আবাসিক প্লট
জমির পরিমাণ: ১৬.৮০ শতাংশ (ষোল দশমিক আট শূন্য শতাংশ)
ক্রেতা/মালিক: শামসুল হুদা ও অংশীদারগণ
পিতা: মৃত এম. এ. হুদা`,
    expectedDag: '1204',
    expectedKhatian: '542',
    expectedArea: 16.8,
  },
  {
    nameEn: 'RS Khatian Extract (Dhanmondi Dag 405)',
    nameBn: 'আরএস খতিয়ানের নকল (ধানমন্ডি দাগ ৪০৫)',
    rawText: `বাংলাদেশ ফর্ম নং ৫৪৬৩ (খতিয়ান)
জেলা: ঢাকা, থানা: ধানমন্ডি, মৌজা: ধানমন্ডি আবাসিক এলাকা
আরএস খতিয়ান নং: ৯৫
দাগ নং: ৪০৫
জমির পরিমাণ: ১২.৫০ শতাংশ (বারো দশমিক পাঁচ শূন্য শতাংশ)
মালিকের নাম: নুরুল ইসলাম চৌধুরী
পিতা: কাফিলউদ্দীন আহমেদ
দখলকার ও মন্তব্য: নিরবচ্ছিন্ন পারিবারিক বাস্তু ভিটি।`,
    expectedDag: '405',
    expectedKhatian: '95',
    expectedArea: 12.5,
  },
];
