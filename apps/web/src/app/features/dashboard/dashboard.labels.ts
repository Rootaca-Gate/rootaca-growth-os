import { DashboardCards } from './dashboard.models';

export const CARD_META: Array<{
  key: keyof DashboardCards;
  label: string;
  hint: string;
}> = [
  { key: 'totalStudents', label: 'Total Students', hint: 'Every student record' },
  { key: 'activeStudents', label: 'Active Students', hint: 'Status is Active' },
  { key: 'todaysSessions', label: "Today's Sessions", hint: 'Live or started today' },
  { key: 'pendingAssessments', label: 'Pending Assessments', hint: 'No completed orientation' },
  { key: 'averageProgress', label: 'Average Progress', hint: 'Latest review per student' },
  { key: 'projectsCompleted', label: 'Projects Completed', hint: 'Classroom projects shipped' },
];

export const ATTENTION_META = [
  {
    key: 'kpiBelowTarget' as const,
    title: 'KPI Below Target',
    empty: 'No KPIs below target',
  },
  {
    key: 'assessmentPending' as const,
    title: 'Assessment Pending',
    empty: 'Every student has a completed orientation',
  },
  {
    key: 'noRecentActivity' as const,
    title: 'No Recent Activity',
    empty: 'All students had activity in the last 14 days',
  },
  {
    key: 'roadmapBehindSchedule' as const,
    title: 'Roadmap Behind Schedule',
    empty: 'No overdue or blocked roadmap items',
  },
];
