import { DirectionService } from '../../../core/direction.service';
import { enumLabel, programEnumLabel, offeringEnumLabel, proposalEnumLabel } from '../partnership.labels';
import {
  PartnershipDeliveryFormat,
  PartnershipProgramLevel,
} from '../partnership.models';
import {
  PartnershipDeliveryMode,
  PartnershipDurationUnit,
} from '../offerings/offering.models';
import { ProposalOfferingLine } from './proposal.models';
import type { ProposalPdfOptions } from './proposal-pdf';

export function blankDisplay(value: string | null | undefined, empty = '—'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : empty;
}

export function snapshotItemTitle(item: {
  title?: string;
  name?: string;
  label?: string;
}): string {
  return item.title?.trim() || item.name?.trim() || item.label?.trim() || '';
}

export function formatSnapshotDuration(
  line: ProposalOfferingLine,
  unitLabel: (unit: PartnershipDurationUnit) => string,
): string | null {
  if (line.snapshotDuration == null) {
    return null;
  }
  const unit = line.snapshotDurationUnit ? ` ${unitLabel(line.snapshotDurationUnit)}` : '';
  return `${line.snapshotDuration}${unit}`;
}

export function formatSnapshotGroupSize(line: ProposalOfferingLine): string | null {
  if (line.snapshotGroupSizeMin != null && line.snapshotGroupSizeMax != null) {
    return `${line.snapshotGroupSizeMin}–${line.snapshotGroupSizeMax}`;
  }
  if (line.snapshotGroupSizeMin != null) {
    return `${line.snapshotGroupSizeMin}+`;
  }
  if (line.snapshotGroupSizeMax != null) {
    return `≤ ${line.snapshotGroupSizeMax}`;
  }
  return null;
}

/** Shared PDF option labels resolved from i18n. */
export function buildProposalPdfOptions(
  i18n: DirectionService,
  autoPrint = false,
): ProposalPdfOptions {
  const t = (key: string) => i18n.t(key);
  return {
    dir: i18n.direction(),
    autoPrint,
    deliveryFormatLabel: (value: PartnershipDeliveryFormat | null | undefined) =>
      programEnumLabel(t, 'deliveryFormat', value),
    deliveryModeLabel: (value: PartnershipDeliveryMode | null | undefined) =>
      offeringEnumLabel(t, 'deliveryMode', value),
    durationUnitLabel: (value: PartnershipDurationUnit | null | undefined) =>
      offeringEnumLabel(t, 'durationUnit', value),
    levelLabel: (value: PartnershipProgramLevel | null | undefined) =>
      programEnumLabel(t, 'level', value),
    pricingModelLabel: (value: string | null | undefined) =>
      proposalEnumLabel(t, 'pricingModel', value),
    discountTypeLabel: (value: string | null | undefined) =>
      proposalEnumLabel(t, 'discountType', value),
    statusLabel: (value: string | null | undefined) =>
      proposalEnumLabel(t, 'status', value),
    fallBackEnum: (value: string | null | undefined) => enumLabel(value),
  };
}
