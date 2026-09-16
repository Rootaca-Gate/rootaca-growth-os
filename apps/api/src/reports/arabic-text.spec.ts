import { containsArabic, splitFontRuns, toVisualLine } from './arabic-text';

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
});
