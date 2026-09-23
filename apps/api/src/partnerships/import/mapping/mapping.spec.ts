import { autoMapHeaders, normalizeHeaderKey } from './field-aliases';
import {
  applyMapping,
  normalizeMappedRow,
  validateMappedRow,
} from './row-mapper';

describe('field-aliases', () => {
  it('normalizes header keys', () => {
    expect(normalizeHeaderKey('School Name')).toBe('school_name');
    expect(normalizeHeaderKey('  Phone-Number ')).toBe('phone_number');
  });

  it('auto-maps common aliases deterministically', () => {
    const mapping = autoMapHeaders([
      'School Name',
      'Website',
      'Phone',
      'Principal',
      'Unknown Column',
    ]);
    expect(mapping['School Name']).toBe('name');
    expect(mapping.Website).toBe('website');
    expect(mapping.Phone).toBe('phone');
    expect(mapping.Principal).toBe('contactName');
    expect(mapping['Unknown Column']).toBeNull();
  });

  it('maps first header when multiple aliases target same field', () => {
    const mapping = autoMapHeaders(['name', 'school_name']);
    expect(mapping.name).toBe('name');
    expect(mapping.school_name).toBeNull();
  });
});

describe('row-mapper', () => {
  it('requires name and validates email/url', () => {
    const mapping = {
      Name: 'name' as const,
      Email: 'contactEmail' as const,
      Website: 'website' as const,
    };
    const { mapped, errors } = applyMapping(
      { Name: '', Email: 'bad', Website: 'not a url' },
      mapping,
    );
    const all = validateMappedRow(mapped, errors);
    expect(all.some((e) => e.field === 'name')).toBe(true);
    expect(all.some((e) => e.field === 'contactEmail')).toBe(true);
    expect(all.some((e) => e.field === 'website')).toBe(true);
  });

  it('normalizes mapped rows using shared helpers', () => {
    const { mapped } = applyMapping(
      {
        Name: '  Example International School  ',
        Phone: '+20 100 000 0000',
        Website: 'https://www.example.edu.eg/about',
        Email: 'Info@Example.edu.eg',
      },
      {
        Name: 'name',
        Phone: 'phone',
        Website: 'website',
        Email: 'contactEmail',
      },
    );
    const normalized = normalizeMappedRow(mapped);
    expect(normalized.normalizedName).toBe('example international school');
    expect(normalized.normalizedPhone).toBe('+201000000000');
    expect(normalized.normalizedWebsiteDomain).toBe('example.edu.eg');
    expect(normalized.normalizedContactEmail).toBe('info@example.edu.eg');
  });

  it('accepts a valid row', () => {
    const { mapped, errors } = applyMapping(
      { Name: 'Valid School', coding: 'yes' },
      { Name: 'name', coding: 'hasCoding' },
    );
    expect(validateMappedRow(mapped, errors)).toEqual([]);
    expect(mapped.hasCoding).toBe(true);
  });
});
