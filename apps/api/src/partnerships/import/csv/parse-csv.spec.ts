import { BadRequestException } from '@nestjs/common';
import { parseCsvText, stripBom } from './parse-csv';

describe('parseCsvText', () => {
  it('parses valid CSV with headers', () => {
    const result = parseCsvText('name,city\nAlpha,Cairo\nBeta,Giza\n');
    expect(result.headers).toEqual(['name', 'city']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ name: 'Alpha', city: 'Cairo' });
  });

  it('handles quoted commas', () => {
    const result = parseCsvText('name,address\n"Example School","Street 1, New Cairo"\n');
    expect(result.rows[0]?.address).toBe('Street 1, New Cairo');
  });

  it('strips BOM', () => {
    expect(stripBom('\uFEFFname\nA\n').startsWith('name')).toBe(true);
    const result = parseCsvText('\uFEFFname\nSchool A\n');
    expect(result.rows[0]?.name).toBe('School A');
  });

  it('rejects empty file', () => {
    expect(() => parseCsvText('')).toThrow(BadRequestException);
  });

  it('rejects headers-only CSV', () => {
    expect(() => parseCsvText('name,city\n')).toThrow(BadRequestException);
  });
});
