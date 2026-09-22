import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REPORT_FONT_BUFFERS } from './report-font-data';

const LOCAL_FILES = {
  latinRegular: 'NotoSans-Regular.woff',
  latinBold: 'NotoSans-Bold.woff',
  arabicRegular: 'NotoSansArabic-Regular.woff',
  arabicBold: 'NotoSansArabic-Bold.woff',
} as const;

export type ReportFontFiles = {
  latinRegular: string;
  latinBold: string;
  arabicRegular: string;
  arabicBold: string;
};

let cached: ReportFontFiles | null = null;

export function resolveReportFonts(): ReportFontFiles {
  if (cached) {
    return cached;
  }

  const dir = join(tmpdir(), 'rootaca-report-fonts');
  mkdirSync(dir, { recursive: true });

  const files = {
    latinRegular: materialize(dir, 'latinRegular'),
    latinBold: materialize(dir, 'latinBold'),
    arabicRegular: materialize(dir, 'arabicRegular'),
    arabicBold: materialize(dir, 'arabicBold'),
  };

  cached = files;
  return files;
}

function materialize(dir: string, key: keyof typeof LOCAL_FILES): string {
  const fileName = LOCAL_FILES[key];
  const target = join(dir, fileName);
  if (!existsSync(target)) {
    writeFileSync(target, REPORT_FONT_BUFFERS[key]);
  }
  if (!existsSync(target)) {
    throw new Error(`Missing ROOTACA report font ${fileName}`);
  }
  return target;
}
