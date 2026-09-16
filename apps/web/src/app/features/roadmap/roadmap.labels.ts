import { RoadmapItemStatus } from './roadmap.models';

export const ROADMAP_STATUSES: RoadmapItemStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
];

export const ROADMAP_STATUS_LABELS: Record<RoadmapItemStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  BLOCKED: 'Blocked',
};
