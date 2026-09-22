import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

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

// Keep static joins so Vercel/NFT ships the copied Nest assets with the function.
void join(__dirname, 'fonts', LOCAL_FILES.latinRegular);
void join(__dirname, 'fonts', LOCAL_FILES.latinBold);
void join(__dirname, 'fonts', LOCAL_FILES.arabicRegular);
void join(__dirname, 'fonts', LOCAL_FILES.arabicBold);

const requireFromHere = createRequire(__filename);

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
  const taskRoot = process.env.LAMBDA_TASK_ROOT?.trim();
  const cwd = process.cwd();

  const candidates = [
    join(__dirname, 'fonts', localName),
    join(__dirname, '..', 'reports', 'fonts', localName),
    join(cwd, 'src', 'reports', 'fonts', localName),
    join(cwd, 'dist', 'src', 'reports', 'fonts', localName),
    join(cwd, 'apps', 'api', 'src', 'reports', 'fonts', localName),
    join(cwd, 'apps', 'api', 'dist', 'src', 'reports', 'fonts', localName),
    ...(taskRoot
      ? [
          join(taskRoot, 'src', 'reports', 'fonts', localName),
          join(taskRoot, 'dist', 'src', 'reports', 'fonts', localName),
          join(taskRoot, 'fonts', localName),
        ]
      : []),
    join(cwd, 'node_modules', ...packageParts),
    join(cwd, '..', '..', 'node_modules', ...packageParts),
    join(__dirname, '..', '..', '..', 'node_modules', ...packageParts),
    join(__dirname, '..', '..', '..', '..', 'node_modules', ...packageParts),
    resolveFromPackageJson(packageParts[0]!, packageParts[1]!, packageParts.slice(2)),
  ].filter((value): value is string => Boolean(value));

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(
      `Missing ROOTACA report font ${localName}. Looked in: ${candidates.slice(0, 6).join(' | ')}`,
    );
  }
  return found;
}

function resolveFromPackageJson(
  scope: string,
  name: string,
  rest: string[],
): string | undefined {
  try {
    const packageJson = requireFromHere.resolve(`${scope}/${name}/package.json`);
    return join(dirname(packageJson), ...rest);
  } catch {
    return undefined;
  }
}
