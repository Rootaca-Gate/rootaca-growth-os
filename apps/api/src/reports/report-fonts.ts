import { existsSync } from 'node:fs';
import { join } from 'node:path';

const LOCAL_FILES = {
  latinRegular: 'NotoSans-Regular.woff',
  latinBold: 'NotoSans-Bold.woff',
  arabicRegular: 'NotoSansArabic-Regular.woff',
  arabicBold: 'NotoSansArabic-Bold.woff',
} as const;

const PACKAGE_FILES = {
  latinRegular: ['@fontsource', 'noto-sans', 'files', 'noto-sans-latin-400-normal.woff'],
  latinBold: ['@fontsource', 'noto-sans', 'files', 'noto-sans-latin-700-normal.woff'],
  arabicRegular: [
    '@fontsource',
    'noto-sans-arabic',
    'files',
    'noto-sans-arabic-arabic-400-normal.woff',
  ],
  arabicBold: [
    '@fontsource',
    'noto-sans-arabic',
    'files',
    'noto-sans-arabic-arabic-700-normal.woff',
  ],
} as const;

export type ReportFontFiles = {
  latinRegular: string;
  latinBold: string;
  arabicRegular: string;
  arabicBold: string;
};

export function resolveReportFonts(): ReportFontFiles {
  return {
    latinRegular: resolveFont('latinRegular'),
    latinBold: resolveFont('latinBold'),
    arabicRegular: resolveFont('arabicRegular'),
    arabicBold: resolveFont('arabicBold'),
  };
}

function resolveFont(key: keyof typeof LOCAL_FILES): string {
  const localName = LOCAL_FILES[key];
  const packageParts = PACKAGE_FILES[key];
  const candidates = [
    join(__dirname, 'fonts', localName),
    join(process.cwd(), 'src', 'reports', 'fonts', localName),
    join(process.cwd(), 'apps', 'api', 'src', 'reports', 'fonts', localName),
    join(process.cwd(), 'dist', 'src', 'reports', 'fonts', localName),
    join(process.cwd(), 'node_modules', ...packageParts),
    join(process.cwd(), '..', '..', 'node_modules', ...packageParts),
    join(__dirname, '..', '..', '..', '..', 'node_modules', ...packageParts),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(`Missing ROOTACA report font ${localName}`);
  }
  return found;
}
