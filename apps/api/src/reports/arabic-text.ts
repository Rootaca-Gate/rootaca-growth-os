import ArabicReshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const reshapeArabic =
  typeof ArabicReshaper.convertArabic === 'function'
    ? ArabicReshaper.convertArabic.bind(ArabicReshaper)
    : (text: string) => text;

export function containsArabic(text: string): boolean {
  return ARABIC_RE.test(text);
}

export function toVisualLine(logical: string, rtl: boolean): string {
  const reshaped = reshapeArabic(logical);
  if (!containsArabic(reshaped)) {
    return reshaped;
  }
  const levels = bidi.getEmbeddingLevels(reshaped, rtl ? 'rtl' : 'ltr');
  return bidi.getReorderedString(reshaped, levels);
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
