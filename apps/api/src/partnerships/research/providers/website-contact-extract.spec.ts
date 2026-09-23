import { extractPublicListingFields } from './candidate-extract';

describe('official website contact fallbacks', () => {
  it('extracts bare email and Egyptian phone from unlabeled HTML', () => {
    const html = `
      <html><body>
        <p>Welcome to Nile International School</p>
        <footer>
          Email us at info@nis-eg.com
          Call 01201144449
          <a href="mailto:admissions@nis-eg.com">mail</a>
          <a href="tel:+201201144449">call</a>
        </footer>
      </body></html>
    `;
    const fields = extractPublicListingFields(html, 'https://www.nis-eg.com/');
    expect(fields.email).toMatch(/@nis-eg\.com$/i);
    expect(fields.phone?.replace(/\D/g, '')).toMatch(/01201144449|201201144449/);
  });

  it('skips junk emails', () => {
    const html = `<p>noreply@example.com privacy@wixpress.com real@school.edu.eg</p>`;
    const fields = extractPublicListingFields(html, 'https://school.edu.eg/');
    expect(fields.email).toBe('real@school.edu.eg');
  });
});
