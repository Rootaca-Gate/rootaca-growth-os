import { DirectionService } from '../../../core/direction.service';
import { PartnershipReport, PartnershipReportStatus } from './report.models';

export function blankDisplay(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

export function reportStatusClass(status: PartnershipReportStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'status-badge status-draft';
    case 'IN_REVIEW':
      return 'status-badge status-review';
    case 'PUBLISHED':
      return 'status-badge status-published';
    case 'ARCHIVED':
      return 'status-badge status-archived';
    default:
      return 'status-badge';
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

export function formatPeriod(report: Pick<PartnershipReport, 'periodStart' | 'periodEnd' | 'periodLabel'>): string {
  if (report.periodLabel.trim()) {
    return report.periodLabel.trim();
  }
  const start = report.periodStart?.slice(0, 10) ?? '—';
  const end = report.periodEnd?.slice(0, 10) ?? '—';
  if (!report.periodStart && !report.periodEnd) {
    return '—';
  }
  return `${start} → ${end}`;
}

export function buildReportPdfFilename(report: PartnershipReport): string {
  const school = (report.institutionName || 'School').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
  const type = report.type.replace(/_/g, '-');
  return `ROOTACA_${school}_${type}_Report.pdf`;
}

export function buildReportPdfOptions(i18n: DirectionService): { dir: 'rtl' | 'ltr' } {
  return { dir: i18n.direction() };
}
