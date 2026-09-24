import { PartnershipDurationUnit, PartnershipOffering } from './offering.models';

/** Split comma/semicolon skill strings into display tags. */
export function skillTags(raw: string | null | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Admin-facing placeholder for unset / TBD fields — never invent values. */
export function offeringFieldDisplay(
  value: string | null | undefined,
  emptyLabel = 'TBD',
): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return emptyLabel;
  }
  return trimmed;
}

/**
 * Human duration string, e.g. "12 weeks". Returns null when no duration set —
 * we never invent numbers.
 */
export function formatDuration(
  offering: PartnershipOffering,
  unitLabel: (unit: PartnershipDurationUnit | null) => string,
): string | null {
  if (offering.duration == null) {
    return null;
  }
  const unit = offering.durationUnit ? ` ${unitLabel(offering.durationUnit)}` : '';
  return `${offering.duration}${unit}`;
}

/** "min–max" group size, or a single bound, or null when unset. */
export function formatGroupSize(offering: PartnershipOffering): string | null {
  const { groupSizeMin, groupSizeMax } = offering;
  if (groupSizeMin != null && groupSizeMax != null) {
    return `${groupSizeMin}–${groupSizeMax}`;
  }
  if (groupSizeMin != null) {
    return `${groupSizeMin}+`;
  }
  if (groupSizeMax != null) {
    return `≤ ${groupSizeMax}`;
  }
  return null;
}
