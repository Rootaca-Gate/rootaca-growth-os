/** CSV import limits and batching (Phase E). */
export const IMPORT_MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
export const IMPORT_MAX_ROWS = 10_000;
export const IMPORT_MAX_COLUMNS = 80;
export const IMPORT_EXECUTE_BATCH_SIZE = 50;
/** Why 50: keeps Neon transactions short while avoiding N×round-trips for thousands of rows. */
export const IMPORT_LOOKUP_CHUNK_SIZE = 500;
export const IMPORT_JOB_TTL_HOURS = 48;
export const IMPORT_ALLOWED_MIME = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'text/plain',
  'application/octet-stream',
]);

export const IMPORT_REQUIRED_FIELDS = ['name'] as const;
