import { ROOTACA_LOGO_DATA_URI } from '../programs/rootaca-logo.data';
import { packProgramPdfPages } from '../programs/program-pdf-layout';
import type { PdfBlock } from '../programs/program-pdf-layout';
import type { ProgramPdfLabels } from '../programs/program-pdf';
import { formatProgressPercent } from './delivery-display';
import {
  DeliveryDeliverable,
  DeliveryIssue,
  DeliveryMilestone,
  DeliveryPhase,
  DeliveryRaidItem,
  DeliverySession,
  PartnershipDelivery,
} from './delivery.models';

export { downloadHtmlAsPdf } from '../programs/program-pdf-download';

export type DeliveryPdfLabels = {
  brand: string;
  documentTitle: string;
  initiative: string;
  confidential: string;
  pageOf: string;
  continued: string;
  organization: string;
  // Cover / control
  documentControl: string;
  deliveryNo: string;
  sowNo: string;
  proposalNo: string;
  version: string;
  status: string;
  startDate: string;
  endDate: string;
  school: string;
  // Sections
  executiveSummary: string;
  progressOverview: string;
  completionChecklist: string;
  phases: string;
  milestones: string;
  sessions: string;
  groups: string;
  team: string;
  deliverables: string;
  issues: string;
  raid: string;
  communications: string;
  checkpoints: string;
  reports: string;
  // Metric labels
  overallProgress: string;
  sessionsCompleted: string;
  studentsEngaged: string;
  groupsCount: string;
  deliverablesAccepted: string;
  milestonesCompleted: string;
  phaseProgress: string;
  milestoneProgress: string;
  taskProgress: string;
  sessionProgress: string;
  deliverableProgress: string;
  required: string;
  satisfied: string;
  pending: string;
  // Field labels
  name: string;
  owner: string;
  dueDate: string;
  date: string;
  topic: string;
  instructor: string;
  outcome: string;
  acceptanceCriteria: string;
  severity: string;
  type: string;
  impact: string;
  mitigation: string;
  participants: string;
  subject: string;
  summary: string;
  actionItems: string;
  decisions: string;
  author: string;
  period: string;
};

export type DeliveryPdfOptions = {
  dir: 'rtl' | 'ltr';
  autoPrint?: boolean;
  statusLabel: (value: string | null | undefined) => string;
  phaseStatusLabel: (value: string | null | undefined) => string;
  milestoneStatusLabel: (value: string | null | undefined) => string;
  taskStatusLabel: (value: string | null | undefined) => string;
  sessionStatusLabel: (value: string | null | undefined) => string;
  deliverableStatusLabel: (value: string | null | undefined) => string;
  issueStatusLabel: (value: string | null | undefined) => string;
  issueSeverityLabel: (value: string | null | undefined) => string;
  raidTypeLabel: (value: string | null | undefined) => string;
  raidStatusLabel: (value: string | null | undefined) => string;
  commTypeLabel: (value: string | null | undefined) => string;
  checkpointKindLabel: (value: string | null | undefined) => string;
  checkpointStatusLabel: (value: string | null | undefined) => string;
  reportTypeLabel: (value: string | null | undefined) => string;
  reportStatusLabel: (value: string | null | undefined) => string;
};

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function pdfHasContent(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  return !['n/a', 'na', 'null', 'undefined', 'tbd', '—', '-', 'none'].includes(lower);
}

function text(value: string | null | undefined): string {
  return pdfHasContent(value) ? esc(value!.trim()) : '';
}

function formatDate(value: string | null | undefined): string {
  if (!value?.trim()) {
    return '';
  }
  return value.trim().slice(0, 10);
}

function sectionHead(title: string): string {
  return `
    <div class="pdf-section-head">
      <span class="pdf-accent-bar" aria-hidden="true"></span>
      <h2>${esc(title)}</h2>
    </div>`;
}

function metricHtml(label: string, value: string): string {
  return `<div class="pdf-metric"><span class="pdf-metric-value">${value}</span><span class="pdf-metric-label">${esc(
    label,
  )}</span></div>`;
}

function buildCss(): string {
  return `
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #e8ebe7;
      color: #14231c;
      font-family: "Source Sans 3", "Segoe UI", Tahoma, "IBM Plex Sans Arabic", "Noto Sans Arabic", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    html[dir="rtl"] body, html[dir="rtl"] {
      font-family: "IBM Plex Sans Arabic", "Source Sans 3", "Segoe UI", Tahoma, Arial, sans-serif;
    }
    html[dir="rtl"] .pdf-page, html[dir="rtl"] .pdf-page * {
      letter-spacing: normal;
      word-spacing: normal;
      unicode-bidi: isolate;
    }
    .pdf-doc { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 24px 0 48px; }
    .pdf-page {
      width: 794px; height: 1123px; min-height: 1123px; max-height: 1123px;
      background: #ffffff; position: relative; display: flex; flex-direction: column;
      overflow: hidden; box-shadow: 0 8px 28px rgb(16 35 27 / 10%);
    }
    .pdf-page--cover { justify-content: stretch; }
    .pdf-header {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      padding: 20px 48px 12px; border-bottom: 2px solid #1b6b4a; flex: 0 0 auto;
    }
    .pdf-header-brand {
      display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 700;
      letter-spacing: 0.14em; text-transform: uppercase; color: #1b6b4a;
    }
    .pdf-header-logo { width: 28px; height: 28px; border-radius: 6px; object-fit: cover; display: block; }
    .pdf-header-doc { font-size: 10.5px; font-weight: 600; color: #5d6f66; text-align: end; letter-spacing: 0.06em; text-transform: uppercase; }
    .pdf-main { flex: 1 1 auto; min-height: 0; overflow: hidden; padding: 22px 48px 10px; }
    .pdf-page-body { display: flex; flex-direction: column; gap: 0; }
    .pdf-section-start { margin: 0 0 4px; }
    .pdf-footer { flex: 0 0 auto; padding: 0 48px 16px; margin-top: auto; }
    .pdf-footer-rule { height: 1px; background: #d7e5dd; margin-bottom: 8px; }
    .pdf-footer-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .pdf-footer-copy { font-size: 8.5px; line-height: 1.5; color: #5d6f66; letter-spacing: 0.02em; }
    .pdf-footer-page { font-size: 9.5px; font-weight: 700; color: #1b6b4a; font-variant-numeric: tabular-nums; white-space: nowrap; }
    /* Cover */
    .cover { display: flex; flex-direction: column; min-height: 1123px; padding: 0; position: relative; background: #ffffff; }
    .cover-band { background: linear-gradient(135deg, #1b6b4a 0%, #10402c 100%); color: #ffffff; padding: 56px 56px 40px; }
    .cover-logo { width: 76px; height: 76px; border-radius: 16px; object-fit: cover; display: block; background: #ffffff; box-shadow: 0 2px 10px rgb(0 0 0 / 18%); }
    .cover-brand { margin: 24px 0 0; font-size: 13px; font-weight: 800; letter-spacing: 0.24em; text-transform: uppercase; color: #b9e2cd; }
    .cover-doc-title { margin: 8px 0 0; font-size: 30px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; color: #ffffff; }
    .cover-initiative { margin: 6px 0 0; font-size: 12px; color: #8fc9ac; letter-spacing: 0.04em; }
    .cover-body { padding: 40px 56px 48px; display: flex; flex-direction: column; flex: 1 1 auto; }
    .cover-title { margin: 0 0 6px; font-size: 24px; line-height: 1.2; font-weight: 700; color: #14231c; letter-spacing: -0.02em; }
    .cover-school { margin: 0 0 28px; font-size: 15px; font-weight: 600; color: #1b6b4a; }
    .cover-control-title { margin: 0 0 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #5d6f66; }
    .cover-control { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #d7e5dd; }
    .cover-control th, .cover-control td { text-align: start; padding: 10px 14px; border-bottom: 1px solid #e4eee8; vertical-align: top; }
    .cover-control th { width: 34%; background: #f4f8f6; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #5d6f66; }
    .cover-control td { font-weight: 600; color: #14231c; }
    .cover-foot { margin-top: auto; padding-top: 32px; font-size: 10px; color: #5d6f66; letter-spacing: 0.04em; text-transform: uppercase; }
    /* Sections */
    .pdf-section { margin: 0 0 18px; page-break-inside: avoid; break-inside: avoid; }
    .pdf-section:last-child { margin-bottom: 0; }
    .pdf-section-head { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; }
    .pdf-accent-bar { width: 4px; height: 18px; border-radius: 2px; background: #1b6b4a; flex: 0 0 auto; }
    .pdf-section-head h2 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 0.01em; text-transform: uppercase; color: #10402c; }
    .pdf-lead { margin: 0 0 12px; font-size: 12.5px; line-height: 1.65; color: #3d4f46; white-space: pre-line; }
    /* Metrics */
    .pdf-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
    .pdf-metric { padding: 14px 16px; border: 1px solid #dbe7e0; border-radius: 10px; background: #f7faf8; text-align: center; }
    .pdf-metric-value { display: block; font-size: 22px; font-weight: 800; color: #1b6b4a; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .pdf-metric-label { display: block; margin-top: 6px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #6f8078; }
    /* Progress bars */
    .pdf-bars { margin: 0 0 12px; }
    .pdf-bar-row { margin-bottom: 10px; }
    .pdf-bar-head { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #3d4f46; margin-bottom: 4px; }
    .pdf-bar-track { height: 8px; border-radius: 4px; background: #e4eee8; overflow: hidden; }
    .pdf-bar-fill { height: 100%; background: #1b6b4a; border-radius: 4px; }
    /* Checklist */
    .pdf-check-list { margin: 0; padding: 0; list-style: none; }
    .pdf-check { display: flex; gap: 10px; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid #eef3f0; }
    .pdf-check:last-child { border-bottom: 0; }
    .pdf-check-mark { flex: 0 0 20px; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; margin-top: 1px; }
    .pdf-check-mark.on { background: #e0f0e8; color: #1b6b4a; }
    .pdf-check-mark.off { background: #f0eee0; color: #9a8a3a; }
    .pdf-check-body { flex: 1 1 auto; }
    .pdf-check-body strong { font-size: 12.5px; color: #14231c; }
    .pdf-check-body p { margin: 2px 0 0; font-size: 11px; color: #5d6f66; }
    .pdf-pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9.5px; font-weight: 700; background: #eef3f0; color: #3d4f46; margin-inline-start: 6px; }
    /* Tables */
    .pdf-table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin: 0 0 12px; }
    .pdf-table th { text-align: start; padding: 9px 8px; background: #1b6b4a; color: #ffffff; font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
    .pdf-table td { padding: 9px 8px; border-bottom: 1px solid #e4eee8; color: #14231c; vertical-align: top; }
    .pdf-table tr:nth-child(even) td { background: #f7faf8; }
    .pdf-status-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #eef3f0; color: #3a4a43; font-size: 10px; font-weight: 700; white-space: nowrap; }
    /* Timeline */
    .pdf-timeline { margin: 4px 0 12px; padding: 0; }
    .pdf-tl-item { position: relative; padding: 0 0 16px 26px; page-break-inside: avoid; break-inside: avoid; }
    html[dir="rtl"] .pdf-tl-item { padding: 0 26px 16px 0; }
    .pdf-tl-item::before { content: ""; position: absolute; inset-inline-start: 6px; top: 4px; bottom: -4px; width: 2px; background: #cfe0d6; }
    .pdf-tl-item:last-child::before { display: none; }
    .pdf-tl-dot { position: absolute; inset-inline-start: 0; top: 2px; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; border: 3px solid #1b6b4a; }
    .pdf-tl-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
    .pdf-tl-name { font-size: 13px; font-weight: 700; color: #14231c; }
    .pdf-tl-range { font-size: 10.5px; font-weight: 600; color: #5d6f66; font-variant-numeric: tabular-nums; }
    .pdf-tl-desc { margin: 3px 0 0; font-size: 11.5px; line-height: 1.5; color: #3d4f46; }
    .pdf-tl-meta { margin-top: 4px; display: flex; gap: 8px; flex-wrap: wrap; }
    .pdf-meta-block { margin-top: 18px; padding-top: 12px; border-top: 1px solid #e4eee8; font-size: 9px; line-height: 1.5; color: #8a9a91; }
  `;
}

function progressBar(label: string, ratio: number | null): string {
  if (ratio === null) {
    return '';
  }
  const clamped = Math.max(0, Math.min(100, ratio));
  return `<div class="pdf-bar-row">
    <div class="pdf-bar-head"><span>${esc(label)}</span><span>${esc(formatProgressPercent(ratio))}</span></div>
    <div class="pdf-bar-track"><div class="pdf-bar-fill" style="width:${clamped}%"></div></div>
  </div>`;
}

function phasesTimeline(items: DeliveryPhase[], options: DeliveryPdfOptions): string {
  return `<div class="pdf-timeline">${items
    .map((p) => {
      const range = [formatDate(p.startDate), formatDate(p.endDate)].filter(Boolean).join(' → ');
      return `<div class="pdf-tl-item">
        <span class="pdf-tl-dot" aria-hidden="true"></span>
        <div class="pdf-tl-head">
          <span class="pdf-tl-name">${esc(p.name)}</span>
          ${range ? `<span class="pdf-tl-range">${esc(range)}</span>` : ''}
        </div>
        ${pdfHasContent(p.description) ? `<p class="pdf-tl-desc">${esc(p.description.trim())}</p>` : ''}
        <div class="pdf-tl-meta"><span class="pdf-status-tag">${esc(
          options.phaseStatusLabel(p.status),
        )}</span></div>
      </div>`;
    })
    .join('')}</div>`;
}

function milestoneTimeline(items: DeliveryMilestone[], options: DeliveryPdfOptions): string {
  return `<div class="pdf-timeline">${items
    .map((m) => {
      const range = [formatDate(m.startDate), formatDate(m.endDate)].filter(Boolean).join(' → ');
      return `<div class="pdf-tl-item">
        <span class="pdf-tl-dot" aria-hidden="true"></span>
        <div class="pdf-tl-head">
          <span class="pdf-tl-name">${esc(m.name)}</span>
          ${range ? `<span class="pdf-tl-range">${esc(range)}</span>` : ''}
        </div>
        ${pdfHasContent(m.description) ? `<p class="pdf-tl-desc">${esc(m.description.trim())}</p>` : ''}
        <div class="pdf-tl-meta"><span class="pdf-status-tag">${esc(
          options.milestoneStatusLabel(m.status),
        )}</span></div>
      </div>`;
    })
    .join('')}</div>`;
}

function sessionRows(items: DeliverySession[], labels: DeliveryPdfLabels, options: DeliveryPdfOptions): string {
  return items
    .map(
      (s) => `<tr>
        <td>${s.sessionNumber}</td>
        <td>${formatDate(s.sessionDate) ? esc(formatDate(s.sessionDate)) : '—'}</td>
        <td>${text(s.topic) || '—'}</td>
        <td>${text(s.instructorName) || '—'}</td>
        <td>${text(s.sessionOutcome) || '—'}</td>
        <td><span class="pdf-status-tag">${esc(options.sessionStatusLabel(s.status))}</span></td>
      </tr>`,
    )
    .join('');
}

function deliverableRows(items: DeliveryDeliverable[], options: DeliveryPdfOptions): string {
  return items
    .map(
      (d) => `<tr>
        <td><strong>${esc(d.name)}</strong>${
          pdfHasContent(d.description) ? `<div>${esc(d.description.trim())}</div>` : ''
        }</td>
        <td>${text(d.owner) || '—'}</td>
        <td>${formatDate(d.dueDate) ? esc(formatDate(d.dueDate)) : '—'}</td>
        <td>${text(d.acceptanceCriteria) || '—'}</td>
        <td><span class="pdf-status-tag">${esc(options.deliverableStatusLabel(d.status))}</span></td>
      </tr>`,
    )
    .join('');
}

function issueRows(items: DeliveryIssue[], options: DeliveryPdfOptions): string {
  return items
    .map(
      (i) => `<tr>
        <td><strong>${esc(i.title)}</strong>${
          pdfHasContent(i.description) ? `<div>${esc(i.description.trim())}</div>` : ''
        }</td>
        <td>${text(i.owner) || '—'}</td>
        <td><span class="pdf-status-tag">${esc(options.issueSeverityLabel(i.severity))}</span></td>
        <td><span class="pdf-status-tag">${esc(options.issueStatusLabel(i.status))}</span></td>
      </tr>`,
    )
    .join('');
}

function raidRows(items: DeliveryRaidItem[], options: DeliveryPdfOptions): string {
  return items
    .map(
      (r) => `<tr>
        <td><span class="pdf-status-tag">${esc(options.raidTypeLabel(r.type))}</span></td>
        <td><strong>${esc(r.title)}</strong>${
          pdfHasContent(r.description) ? `<div>${esc(r.description.trim())}</div>` : ''
        }</td>
        <td>${text(r.mitigation) || '—'}</td>
        <td><span class="pdf-status-tag">${esc(options.raidStatusLabel(r.status))}</span></td>
      </tr>`,
    )
    .join('');
}

function buildDeliveryBlocks(
  delivery: PartnershipDelivery,
  labels: DeliveryPdfLabels,
  options: DeliveryPdfOptions,
): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  let seq = 0;
  const nextKey = (prefix: string) => `${prefix}-${seq++}`;

  // Progress overview — computed KPIs only.
  {
    const kpis = delivery.kpis;
    const progress = delivery.progress;
    blocks.push({
      key: nextKey('head'),
      html: `<section class="pdf-section-start">${sectionHead(labels.progressOverview)}</section>`,
      sectionTitle: labels.progressOverview,
      keepWithNext: true,
    });
    const metrics = [
      metricHtml(labels.overallProgress, esc(formatProgressPercent(progress.overallPercent))),
      metricHtml(labels.sessionsCompleted, `${kpis.sessionsCompleted}/${kpis.sessionsTotal}`),
      metricHtml(labels.studentsEngaged, String(kpis.studentsUnique)),
      metricHtml(labels.groupsCount, String(kpis.groupsCount)),
      metricHtml(labels.deliverablesAccepted, `${kpis.deliverablesAccepted}/${kpis.deliverablesTotal}`),
      metricHtml(labels.milestonesCompleted, `${kpis.milestonesCompleted}/${kpis.milestonesTotal}`),
    ];
    blocks.push({
      key: nextKey('metrics'),
      html: `<div class="pdf-metrics">${metrics.join('')}</div>`,
      sectionTitle: labels.progressOverview,
    });
    const bars = [
      progressBar(labels.phaseProgress, progress.phaseProgress.ratio),
      progressBar(labels.milestoneProgress, progress.milestoneProgress.ratio),
      progressBar(labels.taskProgress, progress.taskProgress.ratio),
      progressBar(labels.sessionProgress, progress.sessionProgress.ratio),
      progressBar(labels.deliverableProgress, progress.deliverableProgress.ratio),
    ].filter(Boolean);
    if (bars.length) {
      blocks.push({
        key: nextKey('bars'),
        html: `<div class="pdf-bars">${bars.join('')}</div>`,
        sectionTitle: labels.progressOverview,
      });
    }
  }

  // Completion checklist
  {
    const items = delivery.completionChecklist?.items ?? [];
    if (items.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.completionChecklist)}</section>`,
        sectionTitle: labels.completionChecklist,
        keepWithNext: true,
      });
      const list = items
        .map(
          (it) => `<li class="pdf-check">
            <span class="pdf-check-mark ${it.satisfied ? 'on' : 'off'}" aria-hidden="true">${
              it.satisfied ? '✓' : '•'
            }</span>
            <div class="pdf-check-body">
              <strong>${esc(it.label)}</strong>
              ${it.required ? `<span class="pdf-pill">${esc(labels.required)}</span>` : ''}
              ${pdfHasContent(it.detail) ? `<p>${esc(it.detail.trim())}</p>` : ''}
            </div>
          </li>`,
        )
        .join('');
      blocks.push({
        key: nextKey('checklist'),
        html: `<ul class="pdf-check-list">${list}</ul>`,
        sectionTitle: labels.completionChecklist,
      });
    }
  }

  // Phases
  {
    const items = [...(delivery.phases ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    if (items.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.phases)}</section>`,
        sectionTitle: labels.phases,
        keepWithNext: true,
      });
      blocks.push({
        key: nextKey('phases'),
        html: phasesTimeline(items, options),
        sectionTitle: labels.phases,
      });
    }
  }

  // Milestones
  {
    const items = [...(delivery.milestones ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    if (items.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.milestones)}</section>`,
        sectionTitle: labels.milestones,
        keepWithNext: true,
      });
      items.forEach((m, i) => {
        blocks.push({
          key: nextKey('ms'),
          html: milestoneTimeline([m], options),
          sectionTitle: labels.milestones,
          keepWithNext: i < items.length - 1,
        });
      });
    }
  }

  // Sessions
  {
    const items = [...(delivery.sessions ?? [])].sort((a, b) => a.sessionNumber - b.sessionNumber);
    if (items.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.sessions)}</section>`,
        sectionTitle: labels.sessions,
        keepWithNext: true,
      });
      blocks.push({
        key: nextKey('sessions'),
        html: `<table class="pdf-table"><thead><tr>
          <th>#</th>
          <th>${esc(labels.date)}</th>
          <th>${esc(labels.topic)}</th>
          <th>${esc(labels.instructor)}</th>
          <th>${esc(labels.outcome)}</th>
          <th>${esc(labels.status)}</th>
        </tr></thead><tbody>${sessionRows(items, labels, options)}</tbody></table>`,
        sectionTitle: labels.sessions,
      });
    }
  }

  // Deliverables
  {
    const items = [...(delivery.deliverables ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    if (items.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.deliverables)}</section>`,
        sectionTitle: labels.deliverables,
        keepWithNext: true,
      });
      blocks.push({
        key: nextKey('deliv'),
        html: `<table class="pdf-table"><thead><tr>
          <th>${esc(labels.name)}</th>
          <th>${esc(labels.owner)}</th>
          <th>${esc(labels.dueDate)}</th>
          <th>${esc(labels.acceptanceCriteria)}</th>
          <th>${esc(labels.status)}</th>
        </tr></thead><tbody>${deliverableRows(items, options)}</tbody></table>`,
        sectionTitle: labels.deliverables,
      });
    }
  }

  // Issues
  {
    const items = delivery.issues ?? [];
    if (items.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.issues)}</section>`,
        sectionTitle: labels.issues,
        keepWithNext: true,
      });
      blocks.push({
        key: nextKey('issues'),
        html: `<table class="pdf-table"><thead><tr>
          <th>${esc(labels.name)}</th>
          <th>${esc(labels.owner)}</th>
          <th>${esc(labels.severity)}</th>
          <th>${esc(labels.status)}</th>
        </tr></thead><tbody>${issueRows(items, options)}</tbody></table>`,
        sectionTitle: labels.issues,
      });
    }
  }

  // RAID
  {
    const items = [...(delivery.raidItems ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    if (items.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.raid)}</section>`,
        sectionTitle: labels.raid,
        keepWithNext: true,
      });
      blocks.push({
        key: nextKey('raid'),
        html: `<table class="pdf-table"><thead><tr>
          <th>${esc(labels.type)}</th>
          <th>${esc(labels.name)}</th>
          <th>${esc(labels.mitigation)}</th>
          <th>${esc(labels.status)}</th>
        </tr></thead><tbody>${raidRows(items, options)}</tbody></table>`,
        sectionTitle: labels.raid,
      });
    }
  }

  // Communications
  {
    const items = [...(delivery.communications ?? [])].sort(
      (a, b) => (b.occurredAt || '').localeCompare(a.occurredAt || ''),
    );
    if (items.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.communications)}</section>`,
        sectionTitle: labels.communications,
        keepWithNext: true,
      });
      const rows = items
        .map(
          (c) => `<tr>
            <td>${formatDate(c.occurredAt) ? esc(formatDate(c.occurredAt)) : '—'}</td>
            <td><span class="pdf-status-tag">${esc(options.commTypeLabel(c.type))}</span></td>
            <td><strong>${text(c.subject) || '—'}</strong>${
              pdfHasContent(c.summary) ? `<div>${esc(c.summary.trim())}</div>` : ''
            }</td>
            <td>${text(c.actionItems) || '—'}</td>
          </tr>`,
        )
        .join('');
      blocks.push({
        key: nextKey('comms'),
        html: `<table class="pdf-table"><thead><tr>
          <th>${esc(labels.date)}</th>
          <th>${esc(labels.type)}</th>
          <th>${esc(labels.subject)}</th>
          <th>${esc(labels.actionItems)}</th>
        </tr></thead><tbody>${rows}</tbody></table>`,
        sectionTitle: labels.communications,
      });
    }
  }

  // Checkpoints
  {
    const items = [...(delivery.checkpoints ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    if (items.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.checkpoints)}</section>`,
        sectionTitle: labels.checkpoints,
        keepWithNext: true,
      });
      const rows = items
        .map(
          (c) => `<tr>
            <td><span class="pdf-status-tag">${esc(options.checkpointKindLabel(c.kind))}</span></td>
            <td><strong>${esc(c.name)}</strong></td>
            <td>${formatDate(c.checkpointDate) ? esc(formatDate(c.checkpointDate)) : '—'}</td>
            <td>${text(c.decisions) || '—'}</td>
            <td><span class="pdf-status-tag">${esc(options.checkpointStatusLabel(c.status))}</span></td>
          </tr>`,
        )
        .join('');
      blocks.push({
        key: nextKey('cp'),
        html: `<table class="pdf-table"><thead><tr>
          <th>${esc(labels.type)}</th>
          <th>${esc(labels.name)}</th>
          <th>${esc(labels.date)}</th>
          <th>${esc(labels.decisions)}</th>
          <th>${esc(labels.status)}</th>
        </tr></thead><tbody>${rows}</tbody></table>`,
        sectionTitle: labels.checkpoints,
      });
    }
  }

  // Reports index
  {
    const items = delivery.reports ?? [];
    if (items.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.reports)}</section>`,
        sectionTitle: labels.reports,
        keepWithNext: true,
      });
      const rows = items
        .map(
          (r) => `<tr>
            <td><strong>${esc(r.title)}</strong></td>
            <td><span class="pdf-status-tag">${esc(options.reportTypeLabel(r.type))}</span></td>
            <td>${text(r.periodLabel) || '—'}</td>
            <td>${text(r.author) || '—'}</td>
            <td><span class="pdf-status-tag">${esc(options.reportStatusLabel(r.status))}</span></td>
          </tr>`,
        )
        .join('');
      blocks.push({
        key: nextKey('reports'),
        html: `<table class="pdf-table"><thead><tr>
          <th>${esc(labels.name)}</th>
          <th>${esc(labels.type)}</th>
          <th>${esc(labels.period)}</th>
          <th>${esc(labels.author)}</th>
          <th>${esc(labels.status)}</th>
        </tr></thead><tbody>${rows}</tbody></table>`,
        sectionTitle: labels.reports,
      });
    }
  }

  blocks.push({
    key: nextKey('meta'),
    html: `<div class="pdf-meta-block">${esc(labels.documentTitle)} · ${esc(
      delivery.deliveryNumber,
    )} · ${esc(labels.organization)} · ${esc(labels.initiative)}</div>`,
  });

  return blocks;
}

function pageShell(options: {
  logo: string;
  brand: string;
  documentTitle: string;
  body: string;
  pageIndex: number;
  pageCount: number;
  isCover: boolean;
  labels: DeliveryPdfLabels;
  delivery: PartnershipDelivery;
}): string {
  const { logo, brand, documentTitle, body, pageIndex, isCover, labels, delivery } = options;
  if (isCover) {
    return `<section class="pdf-page pdf-page--cover" data-page="${pageIndex}">${body}</section>`;
  }
  const pageLabel = labels.pageOf
    .replace('{current}', String(pageIndex))
    .replace('{total}', String(options.pageCount));
  const footerParts = [
    labels.brand,
    labels.initiative,
    labels.documentTitle,
    labels.confidential,
    `${labels.deliveryNo} ${delivery.deliveryNumber}`,
  ];
  return `
  <section class="pdf-page" data-page="${pageIndex}">
    <header class="pdf-header">
      <div class="pdf-header-brand">
        <img src="${logo}" alt="${esc(brand)}" class="pdf-header-logo" />
        <span>${esc(brand)}</span>
      </div>
      <div class="pdf-header-doc">${esc(documentTitle)} · ${esc(delivery.deliveryNumber)}</div>
    </header>
    <main class="pdf-main">${body}</main>
    <footer class="pdf-footer">
      <div class="pdf-footer-rule" aria-hidden="true"></div>
      <div class="pdf-footer-row">
        <div class="pdf-footer-copy">${footerParts.map((p) => esc(p)).join(' &nbsp;|&nbsp; ')}</div>
        <div class="pdf-footer-page">${esc(pageLabel)}</div>
      </div>
    </footer>
  </section>`;
}

/**
 * Partnership Delivery Report PDF HTML. Uses only stored delivery content and
 * computed progress/KPIs — no invented achievements. Empty sections are omitted.
 */
export async function buildDeliveryPdfHtml(
  delivery: PartnershipDelivery,
  labels: DeliveryPdfLabels,
  options: DeliveryPdfOptions,
): Promise<string> {
  const logo = ROOTACA_LOGO_DATA_URI;
  const autoPrint = options.autoPrint === true;
  const css = buildCss();
  const schoolName = delivery.institution?.name || '';

  const controlRows = [
    [labels.deliveryNo, delivery.deliveryNumber],
    [labels.status, options.statusLabel(delivery.status)],
    [labels.sowNo, delivery.sow?.sowNumber || delivery.sowNumberSnapshot],
    [labels.proposalNo, delivery.proposalNumberSnapshot],
    [labels.startDate, formatDate(delivery.startDate)],
    [labels.endDate, formatDate(delivery.endDate)],
  ]
    .filter(([, v]) => pdfHasContent(v))
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v!.trim())}</td></tr>`)
    .join('');

  const coverBody = `
    <div class="cover">
      <div class="cover-band">
        <img class="cover-logo" src="${logo}" alt="${esc(labels.brand)}" />
        <p class="cover-brand">${esc(labels.brand)}</p>
        <h1 class="cover-doc-title">${esc(labels.documentTitle)}</h1>
        <p class="cover-initiative">${esc(labels.initiative)}</p>
      </div>
      <div class="cover-body">
        <h2 class="cover-title">${esc(delivery.name)}</h2>
        ${schoolName ? `<p class="cover-school">${esc(schoolName)}</p>` : ''}
        <p class="cover-control-title">${esc(labels.documentControl)}</p>
        <table class="cover-control"><tbody>${controlRows}</tbody></table>
        <div class="cover-foot">${esc(labels.confidential)} · ${esc(labels.organization)} · ${esc(
          labels.initiative,
        )}</div>
      </div>
    </div>`;

  const blocks = buildDeliveryBlocks(delivery, labels, options);
  const packed = await packProgramPdfPages(
    blocks,
    labels as unknown as ProgramPdfLabels,
    css,
    options.dir,
  );
  const bodyPages = packed.length
    ? packed
    : [
        {
          html: `<div class="pdf-page-body"><section class="pdf-section"><div class="pdf-meta-block">${esc(
            labels.documentTitle,
          )} · ${esc(delivery.deliveryNumber)}</div></section></div>`,
        },
      ];

  const finalTotal = 1 + bodyPages.length;
  const sheets: string[] = [
    pageShell({
      logo,
      brand: labels.brand,
      documentTitle: labels.documentTitle,
      body: coverBody,
      pageIndex: 1,
      pageCount: finalTotal,
      isCover: true,
      labels,
      delivery,
    }),
  ];

  bodyPages.forEach((page, index) => {
    sheets.push(
      pageShell({
        logo,
        brand: labels.brand,
        documentTitle: labels.documentTitle,
        body: page.html,
        pageIndex: index + 2,
        pageCount: finalTotal,
        isCover: false,
        labels,
        delivery,
      }),
    );
  });

  return `<!DOCTYPE html>
<html lang="${options.dir === 'rtl' ? 'ar' : 'en'}" dir="${options.dir}">
<head>
  <meta charset="utf-8" />
  <title>${esc(delivery.deliveryNumber)} — ${esc(labels.documentTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>${css}</style>
</head>
<body>
  <div class="pdf-doc">${sheets.join('\n')}</div>
  ${
    autoPrint
      ? `<script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        try { window.focus(); window.print(); } catch (e) {}
      }, 500);
    });
  </script>`
      : ''
  }
</body>
</html>`;
}

/** Opens a printable Partnership Delivery Report PDF window. */
export function openDeliveryPdfWindow(html: string): Window | null {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'width=980,height=760');
  if (!win) {
    URL.revokeObjectURL(url);
    return null;
  }
  win.focus();
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
  return win;
}
