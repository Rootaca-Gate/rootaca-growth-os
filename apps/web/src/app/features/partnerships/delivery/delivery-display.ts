import { DirectionService } from '../../../core/direction.service';
import { deliveryEnumLabel } from '../partnership.labels';
import { PartnershipDelivery, ProgressDimension } from './delivery.models';
import type { DeliveryPdfOptions } from './delivery-pdf';

/** Display fallback for empty values. */
export function blankDisplay(value: string | null | undefined, empty = '—'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : empty;
}

/** CSS class for a delivery status badge (soft badge scheme). */
export function deliveryStatusClass(status: string): string {
  return `status-badge status-${status.toLowerCase().replace(/_/g, '-')}`;
}

/** Format a computed percentage (0–100) into a display string. */
export function formatProgressPercent(percent: number | null | undefined): string {
  if (percent == null || Number.isNaN(percent)) {
    return '—';
  }
  const rounded = Math.round(percent * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

/** Ratio dimension → "completed / total" display. */
export function formatDimension(dim: ProgressDimension | null | undefined): string {
  if (!dim) {
    return '—';
  }
  return `${dim.completed} / ${dim.total}`;
}

export type DeliveryRelationshipLink = {
  label: string;
  value: string;
  routerLink?: unknown[];
};

/**
 * Build the PROPOSAL ↓ SOW ↓ DELIVERY relationship chain from the frozen
 * snapshots plus the SOW reference — never invents values.
 */
export function buildDeliveryRelationshipChain(
  delivery: PartnershipDelivery,
  labels: {
    proposal: string;
    sow: string;
    delivery: string;
  },
): DeliveryRelationshipLink[] {
  const chain: DeliveryRelationshipLink[] = [];
  if (delivery.proposalNumberSnapshot?.trim()) {
    chain.push({
      label: labels.proposal,
      value: delivery.proposalNumberSnapshot.trim(),
      routerLink: ['/partnerships/proposals', delivery.proposalId],
    });
  }
  const sowNumber = delivery.sow?.sowNumber?.trim() || delivery.sowNumberSnapshot?.trim();
  if (sowNumber) {
    chain.push({
      label: labels.sow,
      value: sowNumber,
      routerLink: ['/partnerships/sows', delivery.sowId],
    });
  }
  chain.push({ label: labels.delivery, value: delivery.deliveryNumber });
  return chain;
}

/** ROOTACA_[School]_Delivery_[Number]_Report.pdf */
export function buildDeliveryPdfFilename(school: string, deliveryNumber: string): string {
  const clean = (value: string) =>
    value
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/[\s—–_]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  const schoolPart = clean(school) || 'School';
  const numberPart = clean(deliveryNumber) || 'Delivery';
  return `ROOTACA_${schoolPart}_Delivery_${numberPart}_Report.pdf`;
}

/** Shared PDF option labels resolved from i18n. */
export function buildDeliveryPdfOptions(i18n: DirectionService, autoPrint = false): DeliveryPdfOptions {
  const t = (key: string) => i18n.t(key);
  return {
    dir: i18n.direction(),
    autoPrint,
    statusLabel: (value) => deliveryEnumLabel(t, 'status', value),
    phaseStatusLabel: (value) => deliveryEnumLabel(t, 'phaseStatus', value),
    milestoneStatusLabel: (value) => deliveryEnumLabel(t, 'milestoneStatus', value),
    taskStatusLabel: (value) => deliveryEnumLabel(t, 'taskStatus', value),
    sessionStatusLabel: (value) => deliveryEnumLabel(t, 'sessionStatus', value),
    deliverableStatusLabel: (value) => deliveryEnumLabel(t, 'deliverableStatus', value),
    issueStatusLabel: (value) => deliveryEnumLabel(t, 'issueStatus', value),
    issueSeverityLabel: (value) => deliveryEnumLabel(t, 'issueSeverity', value),
    raidTypeLabel: (value) => deliveryEnumLabel(t, 'raidType', value),
    raidStatusLabel: (value) => deliveryEnumLabel(t, 'raidStatus', value),
    commTypeLabel: (value) => deliveryEnumLabel(t, 'commType', value),
    checkpointKindLabel: (value) => deliveryEnumLabel(t, 'checkpointKind', value),
    checkpointStatusLabel: (value) => deliveryEnumLabel(t, 'checkpointStatus', value),
    reportTypeLabel: (value) => deliveryEnumLabel(t, 'reportType', value),
    reportStatusLabel: (value) => deliveryEnumLabel(t, 'reportStatus', value),
  };
}
