import { parse } from 'csv-parse/sync';
import { BadRequestException } from '@nestjs/common';
import { IMPORT_MAX_COLUMNS, IMPORT_MAX_ROWS } from '../import.constants';

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

/** Strip UTF-8 BOM if present. */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Parse comma-separated CSV with quoted fields (csv-parse).
 * Rejects empty files, excessive columns/rows, and malformed CSV.
 */
export function parseCsvText(bufferOrText: Buffer | string): ParsedCsv {
  const text = stripBom(
    typeof bufferOrText === 'string' ? bufferOrText : bufferOrText.toString('utf8'),
  ).trim();

  if (!text) {
    throw new BadRequestException('CSV is empty');
  }

  let records: Record<string, string>[];
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: false,
      trim: true,
      bom: true,
      cast: false,
    }) as Record<string, string>[];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid CSV';
    throw new BadRequestException(`Invalid CSV: ${message}`);
  }

  if (records.length === 0) {
    throw new BadRequestException('CSV has headers but no data rows');
  }

  const headers = Object.keys(records[0] ?? {});
  if (headers.length === 0) {
    throw new BadRequestException('CSV has no columns');
  }
  if (headers.length > IMPORT_MAX_COLUMNS) {
    throw new BadRequestException(
      `Too many columns (${headers.length}). Maximum is ${IMPORT_MAX_COLUMNS}.`,
    );
  }
  if (records.length > IMPORT_MAX_ROWS) {
    throw new BadRequestException(
      `Too many rows (${records.length}). Maximum is ${IMPORT_MAX_ROWS}.`,
    );
  }

  const normalizedRows = records.map((row) => {
    const out: Record<string, string> = {};
    for (const header of headers) {
      const value = row[header];
      out[header] = value == null ? '' : String(value);
    }
    return out;
  });

  return { headers, rows: normalizedRows };
}
