import ArabicReshaper from 'arabic-reshaper';

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const reshapeArabic =
  typeof ArabicReshaper.convertArabic === 'function'
    ? ArabicReshaper.convertArabic.bind(ArabicReshaper)
    : (text: string) => text;

export function containsArabic(text: string): boolean {
  return ARABIC_RE.test(text);
}

/**
 * Prepare text for PDFKit.
 *
 * PDFKit/fontkit already lays out RTL Unicode (including Arabic presentation forms)
 * from right to left. We only reshape so letters join correctly.
 * Applying bidi-js on top of that double-flips the line and makes Arabic look reversed.
 */
export function toVisualLine(logical: string, _rtl = false): string {
  return reshapeArabic(logical);
}

/** @deprecated use toVisualLine */
export function shapePdfText(text: string, rtl: boolean): string {
  return toVisualLine(text, rtl);
}

export type FontRun = {
  text: string;
  arabic: boolean;
};

export function splitFontRuns(text: string): FontRun[] {
  const runs: FontRun[] = [];
  let current = '';
  let arabic = false;

  for (const char of text) {
    const nextArabic = ARABIC_RE.test(char);
    if (current.length === 0) {
      current = char;
      arabic = nextArabic;
      continue;
    }
    if (nextArabic === arabic) {
      current += char;
      continue;
    }
    runs.push({ text: current, arabic });
    current = char;
    arabic = nextArabic;
  }

  if (current.length > 0) {
    runs.push({ text: current, arabic });
  }

  return runs;
}

/** RTL pages draw mixed runs right-to-left so Latin stays on the outer left. */
export function orderedFontRuns(text: string, rtl: boolean): FontRun[] {
  const runs = splitFontRuns(text);
  return rtl ? [...runs].reverse() : runs;
}
