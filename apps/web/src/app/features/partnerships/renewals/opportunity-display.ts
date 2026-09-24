import { OpportunityStatus, OpportunityType } from './opportunity.models';

export function blankDisplay(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

export function opportunityStatusClass(status: OpportunityStatus): string {
  switch (status) {
    case 'IDENTIFIED':
      return 'status-badge status-identified';
    case 'PLANNING':
      return 'status-badge status-planning';
    case 'PROPOSAL_DRAFT':
    case 'PROPOSAL_SENT':
      return 'status-badge status-proposal';
    case 'NEGOTIATION':
      return 'status-badge status-negotiation';
    case 'ACCEPTED':
      return 'status-badge status-accepted';
    case 'CONVERTED':
      return 'status-badge status-converted';
    case 'REJECTED':
    case 'EXPIRED':
      return 'status-badge status-rejected';
    case 'CLOSED':
      return 'status-badge status-closed';
    default:
      return 'status-badge';
  }
}

export function opportunityTypeClass(type: OpportunityType): string {
  switch (type) {
    case 'RENEWAL':
      return 'type-badge type-renewal';
    case 'EXPANSION':
      return 'type-badge type-expansion';
    case 'RENEWAL_AND_EXPANSION':
      return 'type-badge type-both';
    default:
      return 'type-badge';
  }
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return `${value}%`;
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return String(value);
}

export function formatDate(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 10) : '—';
}
