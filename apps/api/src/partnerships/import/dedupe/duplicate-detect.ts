import { PartnershipImportMatchConfidence } from '@prisma/client';
import { NormalizedImportRow } from '../mapping/row-mapper';

export type InstitutionLookup = {
  id: string;
  name: string;
  normalizedName: string | null;
  normalizedPhone: string | null;
  normalizedWebsiteDomain: string | null;
  city: string | null;
  governorate: string | null;
  generalEmail: string | null;
  contactEmail: string | null;
  admissionsEmail: string | null;
};

export type DuplicateMatch = {
  confidence: PartnershipImportMatchConfidence;
  reasons: string[];
  matchedInstitutionId: string | null;
  matchedInstitutionName: string | null;
  csvDuplicateOfRow: number | null;
};

function cityKey(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.trim().toLowerCase();
}

function emailKeys(inst: InstitutionLookup): string[] {
  return [inst.generalEmail, inst.contactEmail, inst.admissionsEmail]
    .filter((v): v is string => Boolean(v))
    .map((v) => v.toLowerCase());
}

function scoreAgainstInstitution(
  row: NormalizedImportRow,
  inst: InstitutionLookup,
): { reasons: string[]; exact: boolean; possible: boolean } {
  const reasons: string[] = [];
  let exact = false;
  let possible = false;

  if (
    row.normalizedWebsiteDomain &&
    inst.normalizedWebsiteDomain &&
    row.normalizedWebsiteDomain === inst.normalizedWebsiteDomain
  ) {
    reasons.push('Same normalized website domain');
    exact = true;
  }

  if (
    row.normalizedPhone &&
    inst.normalizedPhone &&
    row.normalizedPhone === inst.normalizedPhone &&
    row.normalizedPhone.replace(/\D/g, '').length >= 8
  ) {
    reasons.push('Same normalized phone');
    exact = true;
  }

  if (row.normalizedName && inst.normalizedName && row.normalizedName === inst.normalizedName) {
    reasons.push('Same normalized name');
    const sameCity =
      cityKey(row.city) &&
      cityKey(inst.city) &&
      cityKey(row.city) === cityKey(inst.city);
    if (sameCity) {
      reasons.push('Same city');
      exact = true;
    } else {
      possible = true;
      const sameGov =
        cityKey(row.governorate) &&
        cityKey(inst.governorate) &&
        cityKey(row.governorate) === cityKey(inst.governorate);
      if (sameGov) {
        reasons.push('Same governorate');
      }
    }
  }

  if (row.normalizedContactEmail) {
    const emails = emailKeys(inst);
    if (emails.includes(row.normalizedContactEmail)) {
      reasons.push('Same email');
      possible = true;
    }
  }

  return { reasons, exact, possible };
}

function pickBestMatch(
  candidates: Array<{
    inst?: InstitutionLookup;
    csvRow?: number;
    csvName?: string;
    reasons: string[];
    exact: boolean;
    possible: boolean;
  }>,
): DuplicateMatch {
  const exact = candidates.find((c) => c.exact && c.reasons.length > 0);
  if (exact) {
    return {
      confidence: PartnershipImportMatchConfidence.EXACT,
      reasons: exact.reasons,
      matchedInstitutionId: exact.inst?.id ?? null,
      matchedInstitutionName: exact.inst?.name ?? exact.csvName ?? null,
      csvDuplicateOfRow: exact.csvRow ?? null,
    };
  }
  const possible = candidates.find((c) => c.possible && c.reasons.length > 0);
  if (possible) {
    return {
      confidence: PartnershipImportMatchConfidence.POSSIBLE,
      reasons: possible.reasons,
      matchedInstitutionId: possible.inst?.id ?? null,
      matchedInstitutionName: possible.inst?.name ?? possible.csvName ?? null,
      csvDuplicateOfRow: possible.csvRow ?? null,
    };
  }
  return {
    confidence: PartnershipImportMatchConfidence.NONE,
    reasons: [],
    matchedInstitutionId: null,
    matchedInstitutionName: null,
    csvDuplicateOfRow: null,
  };
}

/**
 * Detect DB + in-CSV duplicates for one row.
 * Prefer EXACT over POSSIBLE. Prefer earlier CSV row as canonical for CSV dupes.
 */
export function detectDuplicates(params: {
  rowNumber: number;
  row: NormalizedImportRow;
  dbCandidates: InstitutionLookup[];
  priorCsvRows: Array<{ rowNumber: number; row: NormalizedImportRow; name?: string }>;
}): DuplicateMatch {
  const dbScored = params.dbCandidates.map((inst) => ({
    inst,
    ...scoreAgainstInstitution(params.row, inst),
  }));

  const csvScored = params.priorCsvRows.map((prior) => {
    const fake: InstitutionLookup = {
      id: `csv:${prior.rowNumber}`,
      name: prior.name ?? prior.row.name ?? `Row ${prior.rowNumber}`,
      normalizedName: prior.row.normalizedName,
      normalizedPhone: prior.row.normalizedPhone,
      normalizedWebsiteDomain: prior.row.normalizedWebsiteDomain,
      city: prior.row.city ?? null,
      governorate: prior.row.governorate ?? null,
      generalEmail: prior.row.generalEmail ?? null,
      contactEmail: prior.row.contactEmail ?? null,
      admissionsEmail: prior.row.admissionsEmail ?? null,
    };
    const scored = scoreAgainstInstitution(params.row, fake);
    return {
      csvRow: prior.rowNumber,
      csvName: fake.name,
      ...scored,
    };
  });

  const best = pickBestMatch([...dbScored, ...csvScored]);
  return best;
}

export function defaultDecisionForMatch(
  confidence: PartnershipImportMatchConfidence,
  isValid: boolean,
  csvDuplicateOfRow: number | null,
): 'SKIP' | 'IMPORT' | 'PENDING' {
  if (!isValid) {
    return 'SKIP';
  }
  if (confidence === PartnershipImportMatchConfidence.EXACT || csvDuplicateOfRow != null) {
    return 'SKIP';
  }
  if (confidence === PartnershipImportMatchConfidence.POSSIBLE) {
    return 'SKIP';
  }
  return 'IMPORT';
}
