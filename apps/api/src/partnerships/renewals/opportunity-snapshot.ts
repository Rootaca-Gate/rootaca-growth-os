/**
 * Historical snapshot for a Partnership Renewal / Expansion Opportunity.
 *
 * Built ONLY from existing Delivery and/or Report data. Never invents numbers:
 * every KPI resolves to `null` when the underlying execution data is missing.
 *
 * - Programs / offerings come from the linked SOW scopeOfferings.
 * - KPIs come from the Delivery sessions / groups / attendance / progress,
 *   or from a published Report's frozen `dataSnapshot` when a report is linked.
 */
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildReportDataSnapshot,
  ReportAggregateDelivery,
  ReportDataSnapshot,
} from '../reports/report-aggregate';

export type OpportunityHistoricalKpis = {
  students: number | null;
  groups: number | null;
  sessions: number | null;
  sessionsCompleted: number | null;
  attendancePercent: number | null;
  completionPercent: number | null;
  deliverables: number | null;
  deliverablesAccepted: number | null;
};

export type OpportunityHistoricalSnapshot = {
  generatedAt: string;
  source: 'DELIVERY' | 'REPORT';
  deliveryId: string | null;
  deliveryNumber: string | null;
  deliveryName: string | null;
  reportId: string | null;
  reportNumber: string | null;
  institutionId: string | null;
  institutionName: string | null;
  sowId: string | null;
  sowNumber: string | null;
  proposalId: string | null;
  proposalNumber: string | null;
  programNames: string[];
  offeringNames: string[];
  periodStart: string | null;
  periodEnd: string | null;
  kpis: OpportunityHistoricalKpis;
};

const NULL_KPIS: OpportunityHistoricalKpis = {
  students: null,
  groups: null,
  sessions: null,
  sessionsCompleted: null,
  attendancePercent: null,
  completionPercent: null,
  deliverables: null,
  deliverablesAccepted: null,
};

const deliveryAggregateInclude = {
  institution: { select: { id: true, name: true } },
  proposal: { select: { id: true, proposalNumber: true, title: true } },
  sow: {
    select: {
      id: true,
      sowNumber: true,
      title: true,
      scopeOfferings: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
  phases: { orderBy: { sortOrder: 'asc' as const } },
  milestones: { orderBy: { sortOrder: 'asc' as const } },
  tasks: { orderBy: { sortOrder: 'asc' as const } },
  sessions: {
    orderBy: { sessionNumber: 'asc' as const },
    include: { attendances: { orderBy: { studentId: 'asc' as const } } },
  },
  groups: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      students: {
        orderBy: { joinedAt: 'asc' as const },
        include: { student: { select: { id: true, fullName: true } } },
      },
    },
  },
  deliverables: { orderBy: { sortOrder: 'asc' as const } },
  issues: { orderBy: { createdAt: 'desc' as const } },
  raidItems: { orderBy: [{ type: 'asc' as const }, { sortOrder: 'asc' as const }] },
} satisfies Prisma.PartnershipDeliveryInclude;

type DeliveryAggregateRow = Prisma.PartnershipDeliveryGetPayload<{
  include: typeof deliveryAggregateInclude;
}>;

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function mapDelivery(delivery: DeliveryAggregateRow): ReportAggregateDelivery {
  return {
    id: delivery.id,
    deliveryNumber: delivery.deliveryNumber,
    name: delivery.name,
    status: delivery.status,
    startDate: delivery.startDate,
    endDate: delivery.endDate,
    sowNumberSnapshot: delivery.sowNumberSnapshot,
    proposalNumberSnapshot: delivery.proposalNumberSnapshot,
    scopeSnapshot: delivery.scopeSnapshot,
    institution: delivery.institution,
    sow: delivery.sow,
    proposal: delivery.proposal,
    phases: delivery.phases,
    milestones: delivery.milestones,
    tasks: delivery.tasks,
    sessions: delivery.sessions,
    groups: delivery.groups,
    deliverables: delivery.deliverables,
    issues: delivery.issues,
    raidItems: delivery.raidItems,
  };
}

function snapshotToHistorical(
  snapshot: ReportDataSnapshot,
  source: 'DELIVERY' | 'REPORT',
  extras: {
    reportId?: string | null;
    reportNumber?: string | null;
  } = {},
): OpportunityHistoricalSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    source,
    deliveryId: snapshot.deliveryId ?? null,
    deliveryNumber: snapshot.deliveryNumber ?? null,
    deliveryName: snapshot.deliveryName ?? null,
    reportId: extras.reportId ?? null,
    reportNumber: extras.reportNumber ?? null,
    institutionId: snapshot.institutionId ?? null,
    institutionName: snapshot.institutionName ?? null,
    sowId: snapshot.sowId ?? null,
    sowNumber: snapshot.sowNumber ?? null,
    proposalId: snapshot.proposalId ?? null,
    proposalNumber: snapshot.proposalNumber ?? null,
    programNames: snapshot.programNames ?? [],
    offeringNames: snapshot.offeringNames ?? [],
    periodStart: snapshot.periodStart ?? null,
    periodEnd: snapshot.periodEnd ?? null,
    kpis: {
      students: snapshot.kpis?.students ?? null,
      groups: snapshot.kpis?.groups ?? null,
      sessions: snapshot.kpis?.sessions ?? null,
      sessionsCompleted: snapshot.kpis?.sessionsCompleted ?? null,
      attendancePercent: snapshot.kpis?.attendancePercent ?? null,
      completionPercent: snapshot.kpis?.completionPercent ?? null,
      deliverables: snapshot.kpis?.deliverables ?? null,
      deliverablesAccepted: snapshot.kpis?.deliverablesAccepted ?? null,
    },
  };
}

function parseReportSnapshot(raw: unknown): ReportDataSnapshot | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  return raw as ReportDataSnapshot;
}

/**
 * Build a read-only historical snapshot for an opportunity from the linked
 * previous Delivery and/or Report. When a report is linked and carries a frozen
 * data snapshot, that is preferred (it reflects the numbers as reported to the
 * school). Otherwise the delivery aggregate is computed live from existing data.
 *
 * Returns `null` when neither a delivery nor a report can be resolved.
 */
export async function buildHistoricalSnapshot(
  prisma: PrismaService,
  params: { deliveryId?: string | null; reportId?: string | null },
): Promise<OpportunityHistoricalSnapshot | null> {
  const reportId = params.reportId ?? null;
  const deliveryId = params.deliveryId ?? null;

  if (reportId) {
    const report = await prisma.partnershipReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        reportNumber: true,
        deliveryId: true,
        institutionId: true,
        institution: { select: { name: true } },
        sowId: true,
        sowNumberSnapshot: true,
        proposalId: true,
        proposalNumberSnapshot: true,
        programNameSnapshot: true,
        periodStart: true,
        periodEnd: true,
        dataSnapshot: true,
        delivery: { select: { deliveryNumber: true, name: true } },
      },
    });

    if (report) {
      const snapshot = parseReportSnapshot(report.dataSnapshot);
      if (snapshot) {
        return snapshotToHistorical(snapshot, 'REPORT', {
          reportId: report.id,
          reportNumber: report.reportNumber,
        });
      }

      // Report exists but has no frozen snapshot — fall back to identity fields
      // only, keeping all KPIs null (do not invent execution data).
      const programNames = report.programNameSnapshot
        ? report.programNameSnapshot
            .split(',')
            .map((n) => n.trim())
            .filter((n) => n.length > 0)
        : [];
      return {
        generatedAt: new Date().toISOString(),
        source: 'REPORT',
        deliveryId: report.deliveryId ?? null,
        deliveryNumber: report.delivery?.deliveryNumber ?? null,
        deliveryName: report.delivery?.name ?? null,
        reportId: report.id,
        reportNumber: report.reportNumber,
        institutionId: report.institutionId ?? null,
        institutionName: report.institution?.name ?? null,
        sowId: report.sowId ?? null,
        sowNumber: report.sowNumberSnapshot || null,
        proposalId: report.proposalId ?? null,
        proposalNumber: report.proposalNumberSnapshot || null,
        programNames,
        offeringNames: [],
        periodStart: iso(report.periodStart),
        periodEnd: iso(report.periodEnd),
        kpis: { ...NULL_KPIS },
      };
    }
  }

  if (deliveryId) {
    const delivery = await prisma.partnershipDelivery.findUnique({
      where: { id: deliveryId },
      include: deliveryAggregateInclude,
    });
    if (delivery) {
      const snapshot = buildReportDataSnapshot(mapDelivery(delivery));
      return snapshotToHistorical(snapshot, 'DELIVERY');
    }
  }

  return null;
}
