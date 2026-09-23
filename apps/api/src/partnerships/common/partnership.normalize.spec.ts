import {
  isValidEmailFormat,
  isValidUrlFormat,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizeWebsiteDomain,
  pickDefined,
  sanitizeSpreadsheetValue,
} from './partnership.normalize';

describe('partnership.normalize', () => {
  it('normalizes names (Arabic + English, punctuation, case)', () => {
    expect(normalizeName('  ABC International School!! ')).toBe('abc international school');
    expect(normalizeName('مدرسة النور')).toBe('مدرسة النور');
    expect(normalizeName('')).toBeNull();
    expect(normalizeName(null)).toBeNull();
  });

  it('normalizes phones without inventing country codes', () => {
    expect(normalizePhone('+20 100 111 2233')).toBe('+201001112233');
    expect(normalizePhone('(02) 1234-5678')).toBe('0212345678');
    expect(normalizePhone('')).toBeNull();
  });

  it('normalizes emails and domains', () => {
    expect(normalizeEmail('  Info@School.EDU.eg ')).toBe('info@school.edu.eg');
    expect(normalizeWebsiteDomain('https://www.Example.com/path?q=1')).toBe('example.com');
    expect(normalizeWebsiteDomain('example.com')).toBe('example.com');
    expect(normalizeWebsiteDomain('')).toBeNull();
  });

  it('validates email and url formats', () => {
    expect(isValidEmailFormat('a@b.co')).toBe(true);
    expect(isValidEmailFormat('bad')).toBe(false);
    expect(isValidUrlFormat('https://rootaca.com')).toBe(true);
    expect(isValidUrlFormat('not a url')).toBe(false);
  });

  it('pickDefined skips undefined and optional empty strings', () => {
    expect(pickDefined({ a: 1, b: undefined, c: '' }, { skipEmptyStrings: true })).toEqual({ a: 1 });
  });

  it('sanitizes spreadsheet formula prefixes without breaking phones', () => {
    expect(sanitizeSpreadsheetValue('=HYPERLINK("x")')).toBe('HYPERLINK("x")');
    expect(sanitizeSpreadsheetValue('+201001112233')).toBe('+201001112233');
  });
});
