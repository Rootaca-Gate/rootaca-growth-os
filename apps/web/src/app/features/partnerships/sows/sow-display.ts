import { DirectionService } from '../../../core/direction.service';
import {
  enumLabel,
  offeringEnumLabel,
  programEnumLabel,
  sowEnumLabel,
} from '../partnership.labels';
import {
  PartnershipDeliveryFormat,
  PartnershipProgramLevel,
} from '../partnership.models';
import {
  PartnershipDeliveryMode,
  PartnershipDurationUnit,
} from '../offerings/offering.models';
import { PartnershipSow, SowScopeOffering } from './sow.models';
import type { SowPdfOptions } from './sow-pdf';

export function blankDisplay(value: string | null | undefined, empty = '—'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : empty;
}

/** CSS class for a SOW status badge (mirrors proposal soft badge scheme). */
export function sowStatusClass(status: string): string {
  return `status-badge status-${status.toLowerCase().replace(/_/g, '-')}`;
}

export function formatScopeDuration(
  line: SowScopeOffering,
  unitLabel: (unit: PartnershipDurationUnit) => string,
): string | null {
  if (line.duration == null) {
    return null;
  }
  const unit = line.durationUnit ? ` ${unitLabel(line.durationUnit)}` : '';
  return `${line.duration}${unit}`;
}

export function formatScopeGroupSize(line: SowScopeOffering): string | null {
  if (line.groupSizeMin != null && line.groupSizeMax != null) {
    return `${line.groupSizeMin}–${line.groupSizeMax}`;
  }
  if (line.groupSizeMin != null) {
    return `${line.groupSizeMin}+`;
  }
  if (line.groupSizeMax != null) {
    return `≤ ${line.groupSizeMax}`;
  }
  return null;
}

export type SowRelationshipLink = {
  label: string;
  value: string;
  routerLink?: unknown[];
};

/**
 * Build the PROGRAM ↓ OFFERING ↓ PROPOSAL ↓ SOW relationship chain from the
 * frozen scope-offering snapshots plus the proposal reference — never invents.
 */
export function buildSowRelationshipChain(
  sow: PartnershipSow,
  labels: {
    program: string;
    offering: string;
    proposal: string;
    sow: string;
  },
): SowRelationshipLink[] {
  const chain: SowRelationshipLink[] = [];
  const first = [...(sow.scopeOfferings ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  if (first?.programName?.trim()) {
    chain.push({ label: labels.program, value: first.programName.trim() });
  }
  if (first?.offeringName?.trim()) {
    const value = first.offeringName.trim();
    chain.push(
      first.offeringId
        ? { label: labels.offering, value, routerLink: ['/partnerships/offerings', first.offeringId] }
        : { label: labels.offering, value },
    );
  }
  if (sow.proposal?.proposalNumber?.trim()) {
    chain.push({
      label: labels.proposal,
      value: sow.proposal.proposalNumber.trim(),
      routerLink: ['/partnerships/proposals', sow.proposalId],
    });
  }
  chain.push({ label: labels.sow, value: sow.sowNumber });
  return chain;
}

/** ROOTACA_[School]_SOW_[Number]_v[Version].pdf */
export function buildSowPdfFilename(school: string, sowNumber: string, version: string): string {
  const clean = (value: string) =>
    value
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/[\s—–_]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  const schoolPart = clean(school) || 'School';
  const numberPart = clean(sowNumber) || 'SOW';
  const versionPart = clean(version) || '1.0';
  return `ROOTACA_${schoolPart}_SOW_${numberPart}_v${versionPart}.pdf`;
}

/** Shared PDF option labels resolved from i18n. */
export function buildSowPdfOptions(i18n: DirectionService, autoPrint = false): SowPdfOptions {
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
    statusLabel: (value: string | null | undefined) => sowEnumLabel(t, 'status', value),
    deliverableStatusLabel: (value: string | null | undefined) =>
      sowEnumLabel(t, 'deliverableStatus', value),
    milestoneStatusLabel: (value: string | null | undefined) =>
      sowEnumLabel(t, 'milestoneStatus', value),
    partyLabel: (value: string | null | undefined) => sowEnumLabel(t, 'party', value),
    fallBackEnum: (value: string | null | undefined) => enumLabel(value),
  };
}
