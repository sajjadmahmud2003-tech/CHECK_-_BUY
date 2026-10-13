import { describe, it, expect } from 'vitest';
import { toBanglaNumber, toEnglishNumber, formatArea } from '../src/lib/bangla-utils';

describe('Bangla Utils & Localization', () => {
  it('converts English numbers to Bangla numerals accurately', () => {
    expect(toBanglaNumber('12345')).toBe('১২৩৪৫');
    expect(toBanglaNumber(405)).toBe('৪০৫');
    expect(toBanglaNumber('0')).toBe('০');
  });

  it('converts Bangla numerals back to English digits', () => {
    expect(toEnglishNumber('১২৩৪৫')).toBe('12345');
    expect(toEnglishNumber('৪০৫')).toBe('405');
  });

  it('formats area properly in decimals and katha for Bangla and English', () => {
    const bnFormat = formatArea(10, 'bn');
    expect(bnFormat).toContain('শতাংশ');
    expect(bnFormat).toContain('কাঠা');

    const enFormat = formatArea(10, 'en');
    expect(enFormat).toContain('Decimals');
    expect(enFormat).toContain('Katha');
  });
});
