// Utility functions for Bangla numerals, dates, and localized formatting

const bnDigits: { [key: string]: string } = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

const enDigits: { [key: string]: string } = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function toBanglaNumber(input: number | string | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = input.toString();
  return str.replace(/[0-9]/g, (digit) => bnDigits[digit] || digit);
}

export function toEnglishNumber(input: string | undefined | null): string {
  if (!input) return '';
  return input.replace(/[০-৯]/g, (digit) => enDigits[digit] || digit);
}

export function formatArea(decimals: number, lang: 'en' | 'bn'): string {
  if (lang === 'bn') {
    const katha = (decimals / 1.65).toFixed(2);
    return `${toBanglaNumber(decimals)} শতাংশ (${toBanglaNumber(katha)} কাঠা)`;
  }
  const katha = (decimals / 1.65).toFixed(2);
  return `${decimals} Decimals (${katha} Katha)`;
}

export function formatDate(dateStr: string | undefined | null, lang: 'en' | 'bn'): string {
  if (!dateStr) return lang === 'bn' ? 'তথ্য নেই' : 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    if (lang === 'bn') {
      const monthsBn = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
      const day = toBanglaNumber(d.getDate());
      const month = monthsBn[d.getMonth()];
      const year = toBanglaNumber(d.getFullYear());
      return `${day} ${month}, ${year}`;
    }

    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatBdt(amount: number | string | undefined | null, lang: 'en' | 'bn' = 'en'): string {
  if (amount === undefined || amount === null) return lang === 'bn' ? '৳০' : '৳0';
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  
  // South Asian formatting (lakhs & crores)
  const parts = num.toLocaleString('en-IN');
  if (lang === 'bn') {
    return `৳ ${toBanglaNumber(parts)}`;
  }
  return `৳ ${parts}`;
}

export const BANGLADESH_DISTRICTS = [
  { en: 'Dhaka', bn: 'ঢাকা' },
  { en: 'Chattogram', bn: 'চট্টগ্রাম' },
  { en: 'Rajshahi', bn: 'রাজশাহী' },
  { en: 'Khulna', bn: 'খুলনা' },
  { en: 'Sylhet', bn: 'সিলেট' },
  { en: 'Barishal', bn: 'বরিশাল' },
  { en: 'Rangpur', bn: 'রংপুর' },
  { en: 'Mymensingh', bn: 'ময়মনসিংহ' },
  { en: 'Gazipur', bn: 'গাজীপুর' },
  { en: 'Narayanganj', bn: 'নারায়ণগঞ্জ' },
  { en: 'Cox\'s Bazar', bn: 'কক্সবাজার' },
  { en: 'Cumilla', bn: 'কুমিল্লা' },
];

export const SURVEY_TYPES_MAP = {
  CS: { nameEn: 'Cadastral Survey (CS)', nameBn: 'সিএস জরিপ (১৯৪০-এর পূর্ববর্তী)', approxYear: 1940 },
  SA: { nameEn: 'State Acquisition Survey (SA)', nameBn: 'এসএ জরিপ (১৯৫৬-১৯৬২)', approxYear: 1962 },
  RS: { nameEn: 'Revisional Survey (RS)', nameBn: 'আরএস জরিপ (১৯৬৫-১৯৮৫)', approxYear: 1980 },
  BS: { nameEn: 'Bangladesh Survey (BS)', nameBn: 'বিএস জরিপ (১৯৯৮-বর্তমান)', approxYear: 2010 },
  City_Survey: { nameEn: 'Dhaka City Survey', nameBn: 'ঢাকা সিটি জরিপ', approxYear: 2005 },
};
