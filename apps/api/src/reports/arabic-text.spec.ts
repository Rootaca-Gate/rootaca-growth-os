import { containsArabic, orderedFontRuns, splitFontRuns, toVisualLine } from './arabic-text';

describe('Arabic PDF text', () => {
  it('reshapes Arabic so letters join instead of staying isolated', () => {
    const logical = 'مرحبا';
    const visual = toVisualLine(logical, true);
    expect(visual).not.toBe(logical);
    expect(containsArabic(visual)).toBe(true);
  });

  it('keeps ROOTACA as one Latin run inside an Arabic line', () => {
    const visual = toVisualLine('تقرير ROOTACA', true);
    const latin = splitFontRuns(visual)
      .find((run) => !run.arabic)
      ?.text.trim();
    expect(latin).toBe('ROOTACA');
  });

  it('does not reverse a Latin-only brand line', () => {
    expect(toVisualLine('ROOTACA', false)).toBe('ROOTACA');
  });

  it('keeps phone numbers in logical order inside an RTL report', () => {
    expect(toVisualLine('+201000000001', true)).toBe('+201000000001');
  });

  it('joins lam-alef instead of leaving the letters isolated', () => {
    const visual = toVisualLine('السلام', true);
    expect(visual).not.toBe('السلام');
    expect(visual.includes('\uFEFB') || visual.includes('\uFEFC')).toBe(true);
  });

  it('does not bidi-flip reshaped Arabic (PDFKit already handles RTL)', () => {
    const visual = toVisualLine('مرحبا', true);
    // Reshape keeps logical reading order of presentation forms; first glyph is meem-initial.
    expect(visual.startsWith('ﻣ') || visual.startsWith('م')).toBe(true);
  });

  it('orders mixed runs for RTL drawing with Latin first', () => {
    const runs = orderedFontRuns(toVisualLine('تقرير ROOTACA', true), true);
    expect(runs[0]?.text.trim()).toBe('ROOTACA');
    expect(runs[runs.length - 1]?.arabic).toBe(true);
  });
});
