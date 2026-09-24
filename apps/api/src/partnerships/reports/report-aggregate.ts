/**
 * Partnership Report aggregation — computed ONLY from Delivery (+ linked SOW/Proposal
 * identity labels). Never invents attendance, assessments, students, or prices.
 */
import {
  PartnershipDeliveryAttendanceStatus,
  PartnershipDeliveryDeliverableStatus,
  PartnershipDeliveryGroupStatus,
  PartnershipDeliveryIssueStatus,
  PartnershipDeliveryRaidStatus,
  PartnershipDeliverySessionStatus,
  PartnershipReportStudentTrackStatus,
} from '@prisma/client';
import {
  computeDeliveryProgress,
  type DeliveryProgressResult,
} from '../delivery/delivery-progress';

export type ReportAggregateDelivery = {
  id: string;
  deliveryNumber: string;
  name: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  sowNumberSnapshot: string;
  proposalNumberSnapshot: string;
  scopeSnapshot: unknown;
  institution: { id: string; name: string };
  sow: {
    id: string;
    sowNumber: string;
    title: string;
    scopeOfferings: Array<{
      programName: string;
      offeringName: string;
      numberOfSessions: number | null;
      duration: number | null;
      durationUnit: string | null;
      shortDescription: string;
    }>;
  };
  proposal: { id: string; proposalNumber: string; title: string };
  phases: Array<{ id: string; name: string; status: string }>;
  milestones: Array<{ id: string; name: string; status: string; requiredForCompletion: boolean }>;
  tasks: Array<{ id: string; title: string; status: string }>;
  sessions: Array<{
    id: string;
    sessionNumber: number;
    sessionDate: Date | null;
    topic: string;
    status: string;
    groupId: string | null;
    attendances: Array<{
      studentId: string;
      status: PartnershipDeliveryAttendanceStatus;
    }>;
  }>;
  groups: Array<{
    id: string;
    name: string;
    grade: string;
    level: string;
    status: PartnershipDeliveryGroupStatus;
    students: Array<{
      studentId: string;
      student: { id: string; fullName: string };
    }>;
  }>;
  deliverables: Array<{
    id: string;
    name: string;
    status: PartnershipDeliveryDeliverableStatus;
    requiredForCompletion: boolean;
  }>;
  issues: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    status: PartnershipDeliveryIssueStatus;
    owner: string;
    resolution: string;
  }>;
  raidItems: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    impact: string;
    status: PartnershipDeliveryRaidStatus;
    owner: string;
    mitigation: string;
  }>;
};

export type ReportKpis = {
  students: number | null;
  groups: number | null;
  sessions: number | null;
  sessionsCompleted: number | null;
  attendancePercent: number | null;
  completionPercent: number | null;
  progressPercent: number | null;
  projects: number | null;
  deliverables: number | null;
  deliverablesAccepted: number | null;
};

export type ReportStudentRow = {
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  attendancePercent: number | null;
  progressPercent: number | null;
  assessment: string | null;
  projectsCount: number | null;
  trackStatus: PartnershipReportStudentTrackStatus;
};

export type ReportGroupRow = {
  groupId: string;
  groupName: string;
  grade: string;
  level: string;
  status: string;
  studentsCount: number;
  sessionsTotal: number;
  sessionsCompleted: number;
  attendancePercent: number | null;
  progressPercent: number | null;
  curriculumCompletionPercent: number | null;
  projectsCount: number | null;
  openIssuesCount: number;
};

export type ReportProjectRow = {
  id: string;
  name: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'PRESENTED';
  completionPercent: number | null;
  assessment: string | null;
  showcaseStatus: string | null;
  groupOrStudents: string | null;
};

export type ReportChallengeRow = {
  id: string;
  kind: 'ISSUE' | 'RISK' | 'ASSUMPTION' | 'DEPENDENCY';
  title: string;
  impact: string;
  status: string;
  owner: string;
  action: string;
};

export type ReportAssessmentSummary = {
  available: boolean;
  initial: null;
  ongoing: null;
  final: null;
  studentsAssessed: number | null;
  averageResult: number | null;
  skillsProgress: null;
  areasNeedingAttention: string[];
  emptyReason: string;
};

export type ReportDataSnapshot = {
  generatedAt: string;
  deliveryId: string;
  deliveryNumber: string;
  deliveryName: string;
  deliveryStatus: string;
  institutionId: string;
  institutionName: string;
  sowId: string;
  sowNumber: string;
  sowTitle: string;
  proposalId: string;
  proposalNumber: string;
  proposalTitle: string;
  programNames: string[];
  offeringNames: string[];
  periodStart: string | null;
  periodEnd: string | null;
  kpis: ReportKpis;
  progress: DeliveryProgressResult;
  students: ReportStudentRow[];
  groups: ReportGroupRow[];
  projects: ReportProjectRow[];
  challenges: ReportChallengeRow[];
  assessment: ReportAssessmentSummary;
  partnershipOverview: {
    school: string;
    sow: string;
    deliveryPeriod: string | null;
    programs: string[];
    groupsCount: number | null;
    studentsCount: number | null;
  };
  deliverySummary: {
    sessionsTotal: number | null;
    sessionsCompleted: number | null;
    attendancePercent: number | null;
    completionPercent: number | null;
    milestonesCompleted: number | null;
    milestonesTotal: number | null;
    deliverablesAccepted: number | null;
    deliverablesTotal: number | null;
  };
};

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function attendancePercent(
  records: Array<{ status: PartnershipDeliveryAttendanceStatus }>,
): number | null {
  if (records.length === 0) {
    return null;
  }
  const present = records.filter(
    (r) =>
      r.status === PartnershipDeliveryAttendanceStatus.PRESENT ||
      r.status === PartnershipDeliveryAttendanceStatus.LATE,
  ).length;
  return Math.round((present / records.length) * 1000) / 10;
}

/**
 * Measurable track status rules (no psychological labels):
 * - COMPLETED: group status is COMPLETED
 * - NOT_ASSESSED: no attendance records for the student
 * - NEEDS_ATTENTION: attendance rate exists and is below 70%
 * - ON_TRACK: attendance rate exists and is >= 70%, or group is ACTIVE with no attendance yet but sessions exist
 */
export function deriveStudentTrackStatus(params: {
  groupStatus: PartnershipDeliveryGroupStatus;
  attendancePercent: number | null;
  hasAttendanceRecords: boolean;
}): PartnershipReportStudentTrackStatus {
  if (params.groupStatus === PartnershipDeliveryGroupStatus.COMPLETED) {
    return PartnershipReportStudentTrackStatus.COMPLETED;
  }
  if (!params.hasAttendanceRecords) {
    return PartnershipReportStudentTrackStatus.NOT_ASSESSED;
  }
  if (params.attendancePercent !== null && params.attendancePercent < 70) {
    return PartnershipReportStudentTrackStatus.NEEDS_ATTENTION;
  }
  return PartnershipReportStudentTrackStatus.ON_TRACK;
}

function mapDeliverableToProjectStatus(
  status: PartnershipDeliveryDeliverableStatus,
): ReportProjectRow['status'] {
  switch (status) {
    case PartnershipDeliveryDeliverableStatus.ACCEPTED:
      return 'COMPLETED';
    case PartnershipDeliveryDeliverableStatus.IN_PROGRESS:
    case PartnershipDeliveryDeliverableStatus.SUBMITTED:
    case PartnershipDeliveryDeliverableStatus.REJECTED:
      return 'IN_PROGRESS';
    case PartnershipDeliveryDeliverableStatus.NOT_STARTED:
    default:
      return 'PLANNED';
  }
}

export function buildReportDataSnapshot(delivery: ReportAggregateDelivery): ReportDataSnapshot {
  const programNames = [
    ...new Set(
      delivery.sow.scopeOfferings.map((o) => o.programName.trim()).filter((n) => n.length > 0),
    ),
  ];
  const offeringNames = [
    ...new Set(
      delivery.sow.scopeOfferings.map((o) => o.offeringName.trim()).filter((n) => n.length > 0),
    ),
  ];

  const sessionsTotal = delivery.sessions.length;
  const sessionsCompleted = delivery.sessions.filter(
    (s) => s.status === PartnershipDeliverySessionStatus.COMPLETED,
  ).length;
  const allAttendance = delivery.sessions.flatMap((s) => s.attendances);
  const attPct = attendancePercent(allAttendance);

  const phasesTotal = delivery.phases.length;
  const phasesCompleted = delivery.phases.filter((p) => p.status === 'COMPLETED').length;
  const milestonesTotal = delivery.milestones.length;
  const milestonesCompleted = delivery.milestones.filter((m) => m.status === 'COMPLETED').length;
  const tasksTotal = delivery.tasks.length;
  const tasksCompleted = delivery.tasks.filter((t) => t.status === 'DONE').length;
  const deliverablesTotal = delivery.deliverables.length;
  const deliverablesAccepted = delivery.deliverables.filter(
    (d) => d.status === PartnershipDeliveryDeliverableStatus.ACCEPTED,
  ).length;

  const progress = computeDeliveryProgress({
    phasesTotal,
    phasesCompleted,
    milestonesTotal,
    milestonesCompleted,
    tasksTotal,
    tasksCompleted,
    sessionsTotal,
    sessionsCompleted,
    deliverablesTotal,
    deliverablesAccepted,
  });

  const studentsUnique = new Map<string, { id: string; fullName: string; groupId: string; groupName: string; groupStatus: PartnershipDeliveryGroupStatus }>();
  for (const group of delivery.groups) {
    for (const gs of group.students) {
      if (!studentsUnique.has(gs.studentId)) {
        studentsUnique.set(gs.studentId, {
          id: gs.student.id,
          fullName: gs.student.fullName,
          groupId: group.id,
          groupName: group.name,
          groupStatus: group.status,
        });
      }
    }
  }

  const openIssues = delivery.issues.filter(
    (i) =>
      i.status === PartnershipDeliveryIssueStatus.OPEN ||
      i.status === PartnershipDeliveryIssueStatus.IN_PROGRESS,
  );

  const students: ReportStudentRow[] = [...studentsUnique.values()].map((stu) => {
    const records = allAttendance.filter((a) => a.studentId === stu.id);
    const stuAtt = attendancePercent(records);
    return {
      studentId: stu.id,
      studentName: stu.fullName,
      groupId: stu.groupId,
      groupName: stu.groupName,
      attendancePercent: stuAtt,
      progressPercent: null,
      assessment: null,
      projectsCount: null,
      trackStatus: deriveStudentTrackStatus({
        groupStatus: stu.groupStatus,
        attendancePercent: stuAtt,
        hasAttendanceRecords: records.length > 0,
      }),
    };
  });

  const groups: ReportGroupRow[] = delivery.groups.map((group) => {
    const groupSessions = delivery.sessions.filter((s) => s.groupId === group.id);
    const groupSessionIds = new Set(groupSessions.map((s) => s.id));
    const groupAttendance = delivery.sessions
      .filter((s) => groupSessionIds.has(s.id) || s.groupId === group.id)
      .flatMap((s) => s.attendances);
    const gAtt = attendancePercent(groupAttendance);
    const gSessionsCompleted = groupSessions.filter(
      (s) => s.status === PartnershipDeliverySessionStatus.COMPLETED,
    ).length;
    const gSessionPct =
      groupSessions.length > 0
        ? Math.round((gSessionsCompleted / groupSessions.length) * 1000) / 10
        : null;

    return {
      groupId: group.id,
      groupName: group.name,
      grade: group.grade,
      level: group.level,
      status: group.status,
      studentsCount: group.students.length,
      sessionsTotal: groupSessions.length,
      sessionsCompleted: gSessionsCompleted,
      attendancePercent: gAtt,
      progressPercent: gSessionPct,
      curriculumCompletionPercent: gSessionPct,
      projectsCount: null,
      openIssuesCount: openIssues.length,
    };
  });

  const projects: ReportProjectRow[] = delivery.deliverables.map((d) => ({
    id: d.id,
    name: d.name,
    status: mapDeliverableToProjectStatus(d.status),
    completionPercent:
      d.status === PartnershipDeliveryDeliverableStatus.ACCEPTED
        ? 100
        : d.status === PartnershipDeliveryDeliverableStatus.NOT_STARTED
          ? 0
          : null,
    assessment: null,
    showcaseStatus: null,
    groupOrStudents: null,
  }));

  const challenges: ReportChallengeRow[] = [
    ...delivery.issues.map((i) => ({
      id: i.id,
      kind: 'ISSUE' as const,
      title: i.title,
      impact: i.severity || i.description,
      status: i.status,
      owner: i.owner,
      action: i.resolution,
    })),
    ...delivery.raidItems.map((r) => ({
      id: r.id,
      kind: (r.type === 'RISK'
        ? 'RISK'
        : r.type === 'ASSUMPTION'
          ? 'ASSUMPTION'
          : r.type === 'DEPENDENCY'
            ? 'DEPENDENCY'
            : 'RISK') as ReportChallengeRow['kind'],
      title: r.title,
      impact: r.impact || r.description,
      status: r.status,
      owner: r.owner,
      action: r.mitigation,
    })),
  ];

  const periodStart = iso(delivery.startDate);
  const periodEnd = iso(delivery.endDate);
  const deliveryPeriod =
    periodStart || periodEnd
      ? [periodStart?.slice(0, 10) ?? '—', periodEnd?.slice(0, 10) ?? '—'].join(' → ')
      : null;

  const studentsCount = studentsUnique.size > 0 ? studentsUnique.size : null;
  const groupsCount = delivery.groups.length > 0 ? delivery.groups.length : null;

  const kpis: ReportKpis = {
    students: studentsCount,
    groups: groupsCount,
    sessions: sessionsTotal > 0 ? sessionsTotal : null,
    sessionsCompleted: sessionsTotal > 0 ? sessionsCompleted : null,
    attendancePercent: attPct,
    completionPercent: progress.overallPercent,
    progressPercent: progress.overallPercent,
    projects: projects.length > 0 ? projects.length : null,
    deliverables: deliverablesTotal > 0 ? deliverablesTotal : null,
    deliverablesAccepted: deliverablesTotal > 0 ? deliverablesAccepted : null,
  };

  return {
    generatedAt: new Date().toISOString(),
    deliveryId: delivery.id,
    deliveryNumber: delivery.deliveryNumber,
    deliveryName: delivery.name,
    deliveryStatus: delivery.status,
    institutionId: delivery.institution.id,
    institutionName: delivery.institution.name,
    sowId: delivery.sow.id,
    sowNumber: delivery.sow.sowNumber,
    sowTitle: delivery.sow.title,
    proposalId: delivery.proposal.id,
    proposalNumber: delivery.proposal.proposalNumber,
    proposalTitle: delivery.proposal.title,
    programNames,
    offeringNames,
    periodStart,
    periodEnd,
    kpis,
    progress,
    students,
    groups,
    projects,
    challenges,
    assessment: {
      available: false,
      initial: null,
      ongoing: null,
      final: null,
      studentsAssessed: null,
      averageResult: null,
      skillsProgress: null,
      areasNeedingAttention: [],
      emptyReason: 'No assessment results are recorded on this Delivery.',
    },
    partnershipOverview: {
      school: delivery.institution.name,
      sow: delivery.sow.sowNumber,
      deliveryPeriod,
      programs: programNames,
      groupsCount,
      studentsCount,
    },
    deliverySummary: {
      sessionsTotal: kpis.sessions,
      sessionsCompleted: kpis.sessionsCompleted,
      attendancePercent: attPct,
      completionPercent: progress.overallPercent,
      milestonesCompleted: milestonesTotal > 0 ? milestonesCompleted : null,
      milestonesTotal: milestonesTotal > 0 ? milestonesTotal : null,
      deliverablesAccepted: kpis.deliverablesAccepted,
      deliverablesTotal: kpis.deliverables,
    },
  };
}

/** School-facing subset — strips internal notes, operational IDs noise, RAID internals. */
export function toSchoolFacingSnapshot(
  snapshot: ReportDataSnapshot,
  narrative: {
    executiveSummary: string;
    achievements: string;
    nextSteps: string;
    recommendations: Array<{
      text: string;
      priority: string;
      owner: string;
      targetDate: string | null;
      isInternal: boolean;
    }>;
  },
): Record<string, unknown> {
  return {
    generatedAt: snapshot.generatedAt,
    school: snapshot.institutionName,
    deliveryNumber: snapshot.deliveryNumber,
    sowNumber: snapshot.sowNumber,
    programNames: snapshot.programNames,
    periodStart: snapshot.periodStart,
    periodEnd: snapshot.periodEnd,
    kpis: snapshot.kpis,
    partnershipOverview: snapshot.partnershipOverview,
    deliverySummary: snapshot.deliverySummary,
    students: snapshot.students.map((s) => ({
      studentName: s.studentName,
      groupName: s.groupName,
      attendancePercent: s.attendancePercent,
      trackStatus: s.trackStatus,
    })),
    groups: snapshot.groups.map((g) => ({
      groupName: g.groupName,
      studentsCount: g.studentsCount,
      attendancePercent: g.attendancePercent,
      sessionsCompleted: g.sessionsCompleted,
      sessionsTotal: g.sessionsTotal,
      progressPercent: g.progressPercent,
    })),
    projects: snapshot.projects.map((p) => ({
      name: p.name,
      status: p.status,
      completionPercent: p.completionPercent,
    })),
    assessment: snapshot.assessment.available
      ? snapshot.assessment
      : { available: false, emptyReason: snapshot.assessment.emptyReason },
    challenges: snapshot.challenges
      .filter((c) => c.kind === 'ISSUE')
      .map((c) => ({
        title: c.title,
        status: c.status,
      })),
    executiveSummary: narrative.executiveSummary,
    achievements: narrative.achievements,
    nextSteps: narrative.nextSteps,
    recommendations: narrative.recommendations
      .filter((r) => !r.isInternal && r.text.trim().length > 0)
      .map((r) => ({
        text: r.text,
        priority: r.priority,
        owner: r.owner,
        targetDate: r.targetDate,
      })),
  };
}

export type PublishValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function validateForPublish(params: {
  institutionId: string;
  deliveryId: string;
  periodStart: Date | null;
  periodEnd: Date | null;
  periodLabel: string;
  snapshot: ReportDataSnapshot | null;
}): PublishValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!params.institutionId) {
    errors.push('School is required.');
  }
  if (!params.deliveryId) {
    errors.push('Delivery is required.');
  }
  const hasPeriod =
    Boolean(params.periodStart) ||
    Boolean(params.periodEnd) ||
    params.periodLabel.trim().length > 0;
  if (!hasPeriod) {
    errors.push('Reporting period is required (start, end, or period label).');
  }
  if (!params.snapshot) {
    errors.push('Report data snapshot is missing. Refresh from Delivery before publishing.');
  }

  if (params.snapshot) {
    if (
      params.snapshot.kpis.students === null &&
      params.snapshot.kpis.sessions === null &&
      params.snapshot.kpis.groups === null
    ) {
      warnings.push('Delivery has limited execution data; KPIs will show as not available.');
    }
    if (!params.snapshot.assessment.available) {
      warnings.push('Assessment section is empty (no assessment results on Delivery).');
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
