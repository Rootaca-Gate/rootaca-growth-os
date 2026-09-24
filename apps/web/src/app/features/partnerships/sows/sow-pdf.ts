import {
  PartnershipDeliveryFormat,
  PartnershipProgramLevel,
} from '../partnership.models';
import {
  PartnershipDeliveryMode,
  PartnershipDurationUnit,
} from '../offerings/offering.models';
import { ROOTACA_LOGO_DATA_URI } from '../programs/rootaca-logo.data';
import { packProgramPdfPages } from '../programs/program-pdf-layout';
import type { PdfBlock } from '../programs/program-pdf-layout';
import type { ProgramPdfLabels } from '../programs/program-pdf';
import { formatScopeDuration, formatScopeGroupSize } from './sow-display';
import {
  PartnershipSow,
  SowDeliverable,
  SowMilestone,
  SowScopeOffering,
} from './sow.models';

export { downloadHtmlAsPdf } from '../programs/program-pdf-download';

export type SowPdfLabels = {
  brand: string;
  documentTitle: string;
  initiative: string;
  confidential: string;
  pageOf: string;
  continued: string;
  organization: string;
  // Cover / document control
  documentControl: string;
  sowNo: string;
  version: string;
  status: string;
  date: string;
  effectiveDate: string;
  startDate: string;
  endDate: string;
  preparedBy: string;
  approvedBy: string;
  // Parties
  parties: string;
  provider: string;
  client: string;
  address: string;
  contact: string;
  email: string;
  phone: string;
  // Sections
  purpose: string;
  targetStudents: string;
  scopeInclusions: string;
  scopeExclusions: string;
  scopeOfferings: string;
  deliveryModel: string;
  activities: string;
  projects: string;
  deliverables: string;
  milestones: string;
  responsibilities: string;
  team: string;
  teamRootaca: string;
  teamSchool: string;
  requirements: string;
  attendance: string;
  assessment: string;
  reporting: string;
  commercialReference: string;
  terms: string;
  signatures: string;
  // Field labels
  programName: string;
  offeringName: string;
  deliveryFormat: string;
  deliveryMode: string;
  targetGrades: string;
  level: string;
  duration: string;
  sessions: string;
  sessionLength: string;
  groupSize: string;
  groups: string;
  minutes: string;
  deliverableName: string;
  owner: string;
  dueDate: string;
  acceptanceCriteria: string;
  milestone: string;
  activity: string;
  rootacaRole: string;
  schoolRole: string;
  role: string;
  name: string;
  responsibility: string;
  equipment: string;
  internet: string;
  classroomLab: string;
  studentDevices: string;
  software: string;
  accountsAccess: string;
  facultyLiaison: string;
  attendanceExpectations: string;
  minimumParticipation: string;
  studentReplacementRules: string;
  makeupSessionRules: string;
  assessmentName: string;
  responsibleParty: string;
  frequency: string;
  format: string;
  proposalNo: string;
  agreedValue: string;
  currency: string;
  paymentTerms: string;
  signatoryName: string;
  signatoryTitle: string;
  signatureLine: string;
  dateLine: string;
};

export type SowPdfOptions = {
  dir: 'rtl' | 'ltr';
  autoPrint?: boolean;
  deliveryFormatLabel: (value: PartnershipDeliveryFormat | null | undefined) => string;
  deliveryModeLabel: (value: PartnershipDeliveryMode | null | undefined) => string;
  durationUnitLabel: (value: PartnershipDurationUnit | null | undefined) => string;
  levelLabel: (value: PartnershipProgramLevel | null | undefined) => string;
  statusLabel: (value: string | null | undefined) => string;
  deliverableStatusLabel: (value: string | null | undefined) => string;
  milestoneStatusLabel: (value: string | null | undefined) => string;
  partyLabel: (value: string | null | undefined) => string;
  fallBackEnum: (value: string | null | undefined) => string;
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

function factHtml(label: string, value: string): string {
  return `<div class="pdf-fact"><span class="pdf-fact-label">${esc(
    label,
  )}</span><strong class="pdf-fact-value">${value}</strong></div>`;
}

function buildCss(): string {
  return `
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #e6e9ee;
      color: #16202c;
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
    .pdf-doc {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 24px 0 48px;
    }
    .pdf-page {
      width: 794px;
      height: 1123px;
      min-height: 1123px;
      max-height: 1123px;
      background: #ffffff;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 8px 28px rgb(16 32 44 / 12%);
    }
    .pdf-page--cover { justify-content: stretch; }
    .pdf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 48px 12px;
      border-bottom: 2px solid #1f3a5f;
      flex: 0 0 auto;
    }
    .pdf-header-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #1f3a5f;
    }
    .pdf-header-logo {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      object-fit: cover;
      display: block;
    }
    .pdf-header-doc {
      font-size: 10.5px;
      font-weight: 600;
      color: #5b6b7c;
      text-align: end;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .pdf-main {
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
      padding: 22px 48px 10px;
    }
    .pdf-page-body { display: flex; flex-direction: column; gap: 0; }
    .pdf-section-start { margin: 0 0 4px; }
    .pdf-footer { flex: 0 0 auto; padding: 0 48px 16px; margin-top: auto; }
    .pdf-footer-rule { height: 1px; background: #d7dee6; margin-bottom: 8px; }
    .pdf-footer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .pdf-footer-copy {
      font-size: 8.5px;
      line-height: 1.5;
      color: #6b7887;
      letter-spacing: 0.02em;
    }
    .pdf-footer-page {
      font-size: 9.5px;
      font-weight: 700;
      color: #1f3a5f;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    /* Cover */
    .cover {
      display: flex;
      flex-direction: column;
      min-height: 1123px;
      padding: 0;
      position: relative;
      background: #ffffff;
    }
    .cover-band {
      background: linear-gradient(135deg, #1f3a5f 0%, #16293f 100%);
      color: #ffffff;
      padding: 56px 56px 40px;
    }
    .cover-logo {
      width: 76px;
      height: 76px;
      border-radius: 16px;
      object-fit: cover;
      display: block;
      background: #ffffff;
      box-shadow: 0 2px 10px rgb(0 0 0 / 18%);
    }
    .cover-brand {
      margin: 24px 0 0;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: #cfe0f5;
    }
    .cover-doc-title {
      margin: 8px 0 0;
      font-size: 30px;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: #ffffff;
    }
    .cover-initiative {
      margin: 6px 0 0;
      font-size: 12px;
      color: #9fb6d4;
      letter-spacing: 0.04em;
    }
    .cover-body { padding: 40px 56px 48px; display: flex; flex-direction: column; flex: 1 1 auto; }
    .cover-sow-title {
      margin: 0 0 6px;
      font-size: 24px;
      line-height: 1.2;
      font-weight: 700;
      color: #16202c;
      letter-spacing: -0.02em;
    }
    .cover-school {
      margin: 0 0 28px;
      font-size: 15px;
      font-weight: 600;
      color: #1f3a5f;
    }
    .cover-control-title {
      margin: 0 0 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6b7887;
    }
    .cover-control {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      border: 1px solid #d7dee6;
    }
    .cover-control th, .cover-control td {
      text-align: start;
      padding: 10px 14px;
      border-bottom: 1px solid #e4e9ef;
      vertical-align: top;
    }
    .cover-control th {
      width: 34%;
      background: #f4f6f9;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #5b6b7c;
    }
    .cover-control td { font-weight: 600; color: #16202c; }
    .cover-parties {
      margin-top: 28px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .cover-party {
      border: 1px solid #d7dee6;
      border-radius: 10px;
      padding: 16px 18px;
      background: #fbfcfd;
    }
    .cover-party h4 {
      margin: 0 0 8px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #1f3a5f;
    }
    .cover-party p { margin: 0 0 3px; font-size: 12px; color: #384857; line-height: 1.5; }
    .cover-party strong { color: #16202c; }
    .cover-foot {
      margin-top: auto;
      padding-top: 32px;
      font-size: 10px;
      color: #6b7887;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    /* Sections */
    .pdf-section { margin: 0 0 18px; page-break-inside: avoid; break-inside: avoid; }
    .pdf-section:last-child { margin-bottom: 0; }
    .pdf-section-head { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; }
    .pdf-accent-bar { width: 4px; height: 18px; border-radius: 2px; background: #1f3a5f; flex: 0 0 auto; }
    .pdf-section-head h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.01em;
      text-transform: uppercase;
      color: #16293f;
    }
    .pdf-lead { margin: 0 0 12px; font-size: 12.5px; line-height: 1.65; color: #384857; white-space: pre-line; }
    .pdf-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
    .pdf-facts--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pdf-fact { padding: 12px 14px; border: 1px solid #e0e6ec; border-radius: 8px; background: #fbfcfd; }
    .pdf-fact-label {
      display: block;
      margin-bottom: 5px;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #7a8797;
    }
    .pdf-fact-value { display: block; font-size: 14px; font-weight: 700; color: #16202c; line-height: 1.3; }
    .pdf-scope-title { margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #16293f; }
    .pdf-scope-program { margin: 0 0 10px; font-size: 11px; font-weight: 600; color: #5b6b7c; }
    .pdf-subhead {
      margin: 16px 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #1f3a5f;
    }
    .pdf-subhead:first-child { margin-top: 0; }
    .pdf-list { margin: 0 0 12px; padding: 0; list-style: none; }
    .pdf-list li {
      position: relative;
      padding: 7px 0 7px 20px;
      font-size: 12.5px;
      line-height: 1.5;
      color: #16202c;
      border-bottom: 1px solid #eef1f5;
    }
    html[dir="rtl"] .pdf-list li { padding: 7px 20px 7px 0; }
    .pdf-list li:last-child { border-bottom: 0; }
    .pdf-list li::before {
      content: "";
      position: absolute;
      inset-inline-start: 2px;
      top: 13px;
      width: 6px;
      height: 6px;
      border-radius: 2px;
      background: #1f3a5f;
    }
    .pdf-list--out li::before { background: #b04242; }
    .pdf-table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin: 0 0 12px; }
    .pdf-table th {
      text-align: start;
      padding: 9px 8px;
      background: #1f3a5f;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .pdf-table td { padding: 9px 8px; border-bottom: 1px solid #e4e9ef; color: #16202c; vertical-align: top; }
    .pdf-table tr:nth-child(even) td { background: #f7f9fb; }
    .pdf-status-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      background: #eef2f7;
      color: #3a4a5b;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
    }
    /* Milestone visual timeline */
    .pdf-timeline { margin: 4px 0 12px; padding: 0; }
    .pdf-tl-item {
      position: relative;
      padding: 0 0 16px 26px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    html[dir="rtl"] .pdf-tl-item { padding: 0 26px 16px 0; }
    .pdf-tl-item::before {
      content: "";
      position: absolute;
      inset-inline-start: 6px;
      top: 4px;
      bottom: -4px;
      width: 2px;
      background: #cfd9e4;
    }
    .pdf-tl-item:last-child::before { display: none; }
    .pdf-tl-dot {
      position: absolute;
      inset-inline-start: 0;
      top: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid #1f3a5f;
    }
    .pdf-tl-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
    .pdf-tl-name { font-size: 13px; font-weight: 700; color: #16202c; }
    .pdf-tl-range { font-size: 10.5px; font-weight: 600; color: #5b6b7c; font-variant-numeric: tabular-nums; }
    .pdf-tl-desc { margin: 3px 0 0; font-size: 11.5px; line-height: 1.5; color: #384857; }
    .pdf-tl-meta { margin-top: 4px; display: flex; gap: 8px; flex-wrap: wrap; }
    /* Requirements grid */
    .pdf-req-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .pdf-req-card { border: 1px solid #e0e6ec; border-radius: 8px; padding: 12px 14px; background: #fbfcfd; page-break-inside: avoid; break-inside: avoid; }
    .pdf-req-card h3 { margin: 0 0 5px; font-size: 11px; font-weight: 700; color: #1f3a5f; letter-spacing: 0.02em; }
    .pdf-req-card p { margin: 0; font-size: 12px; line-height: 1.5; color: #384857; white-space: pre-line; }
    /* Commercial reference */
    .pdf-ref {
      border: 1px solid #d7dee6;
      border-radius: 10px;
      overflow: hidden;
    }
    .pdf-ref-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 16px;
      border-bottom: 1px solid #e4e9ef;
      font-size: 12.5px;
    }
    .pdf-ref-row:last-child { border-bottom: 0; }
    .pdf-ref-row span { color: #5b6b7c; }
    .pdf-ref-row strong { color: #16202c; font-variant-numeric: tabular-nums; }
    .pdf-ref-note { margin: 8px 0 0; font-size: 10px; color: #8a97a6; font-style: italic; }
    /* Signatures */
    .pdf-sign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 8px; }
    .pdf-sign-box { padding: 4px 0; }
    .pdf-sign-party {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #1f3a5f;
      margin: 0 0 30px;
    }
    .pdf-sign-line { border-top: 1.5px solid #16202c; padding-top: 6px; }
    .pdf-sign-field { margin: 0 0 14px; }
    .pdf-sign-field .k { font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #7a8797; }
    .pdf-sign-field .v { font-size: 12.5px; font-weight: 600; color: #16202c; min-height: 16px; }
    .pdf-sign-blank { display: inline-block; min-width: 160px; border-bottom: 1px dashed #9aa7b6; }
    .pdf-parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .pdf-party-card { border: 1px solid #e0e6ec; border-radius: 8px; padding: 14px 16px; background: #fbfcfd; }
    .pdf-party-card h3 { margin: 0 0 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #1f3a5f; }
    .pdf-party-card p { margin: 0 0 4px; font-size: 12px; line-height: 1.5; color: #384857; }
    .pdf-party-card strong { color: #16202c; }
    .pdf-meta-block { margin-top: 18px; padding-top: 12px; border-top: 1px solid #e4e9ef; font-size: 9px; line-height: 1.5; color: #8a97a6; }
  `;
}

function usableScopeItems(sow: PartnershipSow, kind: 'IN_SCOPE' | 'OUT_OF_SCOPE') {
  return (sow.scopeItems ?? [])
    .filter((item) => item.kind === kind && pdfHasContent(item.text))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function pushProse(
  blocks: PdfBlock[],
  nextKey: (p: string) => string,
  title: string,
  body: string | null | undefined,
): void {
  if (!pdfHasContent(body)) {
    return;
  }
  blocks.push({
    key: nextKey('head'),
    html: `<section class="pdf-section-start">${sectionHead(title)}</section>`,
    sectionTitle: title,
    keepWithNext: true,
  });
  blocks.push({
    key: nextKey('prose'),
    html: `<p class="pdf-lead">${esc(body!.trim())}</p>`,
    sectionTitle: title,
  });
}

function scopeOfferingFacts(
  line: SowScopeOffering,
  labels: SowPdfLabels,
  options: SowPdfOptions,
): string[] {
  const duration = formatScopeDuration(line, (u) => options.durationUnitLabel(u)) || '';
  const groupSize = formatScopeGroupSize(line) || '';
  return [
    options.deliveryFormatLabel(line.deliveryFormat) && line.deliveryFormat
      ? factHtml(labels.deliveryFormat, esc(options.deliveryFormatLabel(line.deliveryFormat)))
      : '',
    line.deliveryMode && options.deliveryModeLabel(line.deliveryMode)
      ? factHtml(labels.deliveryMode, esc(options.deliveryModeLabel(line.deliveryMode)))
      : '',
    text(line.targetGrades) ? factHtml(labels.targetGrades, text(line.targetGrades)) : '',
    line.recommendedLevel && options.levelLabel(line.recommendedLevel)
      ? factHtml(labels.level, esc(options.levelLabel(line.recommendedLevel)))
      : '',
    duration ? factHtml(labels.duration, esc(duration)) : '',
    line.numberOfSessions != null ? factHtml(labels.sessions, String(line.numberOfSessions)) : '',
    line.sessionDurationMinutes != null
      ? factHtml(labels.sessionLength, `${line.sessionDurationMinutes} ${esc(labels.minutes)}`)
      : '',
    groupSize ? factHtml(labels.groupSize, esc(groupSize)) : '',
    line.numberOfGroups != null ? factHtml(labels.groups, String(line.numberOfGroups)) : '',
  ].filter(Boolean);
}

function deliverablesRows(items: SowDeliverable[], options: SowPdfOptions): string {
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

function milestoneTimeline(items: SowMilestone[], labels: SowPdfLabels, options: SowPdfOptions): string {
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
        <div class="pdf-tl-meta">
          ${text(m.owner) ? `<span class="pdf-status-tag">${esc(labels.owner)}: ${text(m.owner)}</span>` : ''}
          <span class="pdf-status-tag">${esc(options.milestoneStatusLabel(m.status))}</span>
        </div>
      </div>`;
    })
    .join('')}</div>`;
}

function buildSowBlocks(
  sow: PartnershipSow,
  labels: SowPdfLabels,
  options: SowPdfOptions,
): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  let seq = 0;
  const nextKey = (prefix: string) => `${prefix}-${seq++}`;

  // Parties
  {
    const provider = `
      <article class="pdf-party-card">
        <h3>${esc(labels.provider)}</h3>
        <p><strong>${esc(labels.organization)}</strong></p>
        ${text(sow.rootacaSignatoryName) ? `<p>${esc(labels.contact)}: <strong>${text(sow.rootacaSignatoryName)}</strong></p>` : ''}
        ${text(sow.rootacaSignatoryTitle) ? `<p>${text(sow.rootacaSignatoryTitle)}</p>` : ''}
      </article>`;
    const clientLines = [
      pdfHasContent(sow.clientName) ? `<p><strong>${text(sow.clientName)}</strong></p>` : '',
      pdfHasContent(sow.clientAddress) ? `<p>${esc(labels.address)}: ${text(sow.clientAddress)}</p>` : '',
      pdfHasContent(sow.primaryContactName) ? `<p>${esc(labels.contact)}: ${text(sow.primaryContactName)}</p>` : '',
      pdfHasContent(sow.primaryContactEmail) ? `<p>${esc(labels.email)}: ${text(sow.primaryContactEmail)}</p>` : '',
      pdfHasContent(sow.primaryContactPhone) ? `<p>${esc(labels.phone)}: ${text(sow.primaryContactPhone)}</p>` : '',
    ].filter(Boolean);
    const client = `
      <article class="pdf-party-card">
        <h3>${esc(labels.client)}</h3>
        ${clientLines.join('') || `<p>—</p>`}
      </article>`;
    blocks.push({
      key: nextKey('head'),
      html: `<section class="pdf-section-start">${sectionHead(labels.parties)}</section>`,
      sectionTitle: labels.parties,
      keepWithNext: true,
    });
    blocks.push({
      key: nextKey('parties'),
      html: `<div class="pdf-parties-grid">${provider}${client}</div>`,
      sectionTitle: labels.parties,
    });
  }

  pushProse(blocks, nextKey, labels.purpose, sow.purpose);
  pushProse(blocks, nextKey, labels.targetStudents, sow.targetStudents);

  // Scope inclusions / exclusions
  {
    const inScope = usableScopeItems(sow, 'IN_SCOPE');
    const outScope = usableScopeItems(sow, 'OUT_OF_SCOPE');
    if (inScope.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.scopeInclusions)}</section>`,
        sectionTitle: labels.scopeInclusions,
        keepWithNext: true,
      });
      blocks.push({
        key: nextKey('inscope'),
        html: `<ul class="pdf-list">${inScope.map((i) => `<li>${esc(i.text.trim())}</li>`).join('')}</ul>`,
        sectionTitle: labels.scopeInclusions,
      });
    }
    if (outScope.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.scopeExclusions)}</section>`,
        sectionTitle: labels.scopeExclusions,
        keepWithNext: true,
      });
      blocks.push({
        key: nextKey('outscope'),
        html: `<ul class="pdf-list pdf-list--out">${outScope
          .map((i) => `<li>${esc(i.text.trim())}</li>`)
          .join('')}</ul>`,
        sectionTitle: labels.scopeExclusions,
      });
    }
  }

  // Scope offerings (frozen snapshots)
  {
    const offerings = [...(sow.scopeOfferings ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    offerings.forEach((line, index) => {
      blocks.push({
        key: nextKey('off-head'),
        html: `<section class="pdf-section-start">${
          index === 0 ? sectionHead(labels.scopeOfferings) : ''
        }<h3 class="pdf-scope-title">${esc(line.offeringName)}</h3>
        <p class="pdf-scope-program">${esc(labels.programName)}: ${esc(line.programName)}</p></section>`,
        sectionTitle: labels.scopeOfferings,
        keepWithNext: true,
        pageBreakBefore: index > 0,
      });
      const facts = scopeOfferingFacts(line, labels, options);
      if (facts.length) {
        blocks.push({
          key: nextKey('off-facts'),
          html: `<div class="pdf-facts">${facts.join('')}</div>`,
          sectionTitle: labels.scopeOfferings,
        });
      }
      if (pdfHasContent(line.shortDescription)) {
        blocks.push({
          key: nextKey('off-desc'),
          html: `<p class="pdf-lead">${esc(line.shortDescription.trim())}</p>`,
          sectionTitle: labels.scopeOfferings,
        });
      }
    });
  }

  pushProse(blocks, nextKey, labels.deliveryModel, sow.deliveryModelNotes);
  pushProse(blocks, nextKey, labels.activities, sow.activitiesNotes);
  pushProse(blocks, nextKey, labels.projects, sow.projectsNotes);

  // Deliverables table
  {
    const items = [...(sow.deliverables ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
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
          <th>${esc(labels.deliverableName)}</th>
          <th>${esc(labels.owner)}</th>
          <th>${esc(labels.dueDate)}</th>
          <th>${esc(labels.acceptanceCriteria)}</th>
          <th>${esc(labels.status)}</th>
        </tr></thead><tbody>${deliverablesRows(items, options)}</tbody></table>`,
        sectionTitle: labels.deliverables,
      });
    }
  }

  // Milestones — visual timeline
  {
    const items = [...(sow.milestones ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
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
          html: milestoneTimeline([m], labels, options),
          sectionTitle: labels.milestones,
          keepWithNext: i < items.length - 1,
        });
      });
    }
  }

  // Responsibilities matrix
  {
    const items = [...(sow.responsibilities ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    if (items.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.responsibilities)}</section>`,
        sectionTitle: labels.responsibilities,
        keepWithNext: true,
      });
      const rows = items
        .map(
          (r) => `<tr>
            <td><strong>${esc(r.activity)}</strong></td>
            <td>${text(r.rootacaRole) || '—'}</td>
            <td>${text(r.schoolRole) || '—'}</td>
          </tr>`,
        )
        .join('');
      blocks.push({
        key: nextKey('resp'),
        html: `<table class="pdf-table"><thead><tr>
          <th>${esc(labels.activity)}</th>
          <th>${esc(labels.rootacaRole)}</th>
          <th>${esc(labels.schoolRole)}</th>
        </tr></thead><tbody>${rows}</tbody></table>`,
        sectionTitle: labels.responsibilities,
      });
    }
  }

  // Teams
  {
    const rootaca = (sow.teamMembers ?? []).filter((m) => m.party === 'ROOTACA');
    const school = (sow.teamMembers ?? []).filter((m) => m.party === 'SCHOOL');
    const teamTable = (rows: typeof rootaca) =>
      `<table class="pdf-table"><thead><tr>
        <th>${esc(labels.role)}</th>
        <th>${esc(labels.name)}</th>
        <th>${esc(labels.responsibility)}</th>
        <th>${esc(labels.contact)}</th>
      </tr></thead><tbody>${rows
        .map(
          (m) => `<tr>
            <td><strong>${esc(m.role)}</strong></td>
            <td>${text(m.name) || '—'}</td>
            <td>${text(m.responsibility) || '—'}</td>
            <td>${text(m.contact) || '—'}</td>
          </tr>`,
        )
        .join('')}</tbody></table>`;
    if (rootaca.length || school.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.team)}</section>`,
        sectionTitle: labels.team,
        keepWithNext: true,
      });
      if (rootaca.length) {
        blocks.push({
          key: nextKey('team-r'),
          html: `<h3 class="pdf-subhead">${esc(labels.teamRootaca)}</h3>${teamTable(rootaca)}`,
          sectionTitle: labels.team,
        });
      }
      if (school.length) {
        blocks.push({
          key: nextKey('team-s'),
          html: `<h3 class="pdf-subhead">${esc(labels.teamSchool)}</h3>${teamTable(school)}`,
          sectionTitle: labels.team,
        });
      }
    }
  }

  // Requirements
  {
    const cards = [
      { k: labels.equipment, v: sow.equipmentRequirements },
      { k: labels.internet, v: sow.internetRequirements },
      { k: labels.classroomLab, v: sow.classroomLabRequirements },
      { k: labels.studentDevices, v: sow.studentDevicesRequirements },
      { k: labels.software, v: sow.softwareRequirements },
      { k: labels.accountsAccess, v: sow.accountsAccessRequirements },
      { k: labels.facultyLiaison, v: sow.facultyLiaisonRequirements },
    ].filter((c) => pdfHasContent(c.v));
    if (cards.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.requirements)}</section>`,
        sectionTitle: labels.requirements,
        keepWithNext: true,
      });
      for (let i = 0; i < cards.length; i += 2) {
        const pair = cards.slice(i, i + 2);
        blocks.push({
          key: nextKey('req'),
          html: `<div class="pdf-req-grid">${pair
            .map(
              (c) => `<article class="pdf-req-card"><h3>${esc(c.k)}</h3><p>${esc(c.v!.trim())}</p></article>`,
            )
            .join('')}</div>`,
          sectionTitle: labels.requirements,
        });
      }
    }
  }

  // Attendance & participation
  {
    const cards = [
      { k: labels.attendanceExpectations, v: sow.attendanceExpectations },
      { k: labels.minimumParticipation, v: sow.minimumParticipation },
      { k: labels.studentReplacementRules, v: sow.studentReplacementRules },
      { k: labels.makeupSessionRules, v: sow.makeupSessionRules },
    ].filter((c) => pdfHasContent(c.v));
    if (cards.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.attendance)}</section>`,
        sectionTitle: labels.attendance,
        keepWithNext: true,
      });
      for (let i = 0; i < cards.length; i += 2) {
        const pair = cards.slice(i, i + 2);
        blocks.push({
          key: nextKey('att'),
          html: `<div class="pdf-req-grid">${pair
            .map(
              (c) => `<article class="pdf-req-card"><h3>${esc(c.k)}</h3><p>${esc(c.v!.trim())}</p></article>`,
            )
            .join('')}</div>`,
          sectionTitle: labels.attendance,
        });
      }
    }
  }

  // Assessment
  {
    const items = [...(sow.assessmentItems ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    const hasNotes = pdfHasContent(sow.assessmentNotes) || pdfHasContent(sow.reportingNotes);
    if (items.length || hasNotes) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.assessment)}</section>`,
        sectionTitle: labels.assessment,
        keepWithNext: true,
      });
      if (pdfHasContent(sow.assessmentNotes)) {
        blocks.push({
          key: nextKey('assess-notes'),
          html: `<p class="pdf-lead">${esc(sow.assessmentNotes.trim())}</p>`,
          sectionTitle: labels.assessment,
        });
      }
      if (items.length) {
        const rows = items
          .map(
            (a) => `<tr>
              <td><strong>${esc(a.name)}</strong></td>
              <td>${text(a.responsibleParty) || '—'}</td>
              <td>${text(a.frequency) || '—'}</td>
              <td>${text(a.format) || '—'}</td>
              <td>${formatDate(a.dueDate) ? esc(formatDate(a.dueDate)) : '—'}</td>
            </tr>`,
          )
          .join('');
        blocks.push({
          key: nextKey('assess'),
          html: `<table class="pdf-table"><thead><tr>
            <th>${esc(labels.assessmentName)}</th>
            <th>${esc(labels.responsibleParty)}</th>
            <th>${esc(labels.frequency)}</th>
            <th>${esc(labels.format)}</th>
            <th>${esc(labels.dueDate)}</th>
          </tr></thead><tbody>${rows}</tbody></table>`,
          sectionTitle: labels.assessment,
        });
      }
      if (pdfHasContent(sow.reportingNotes)) {
        blocks.push({
          key: nextKey('report'),
          html: `<h3 class="pdf-subhead">${esc(labels.reporting)}</h3><p class="pdf-lead">${esc(
            sow.reportingNotes.trim(),
          )}</p>`,
          sectionTitle: labels.assessment,
        });
      }
    }
  }

  // Commercial reference (read-only snapshot)
  {
    const rows = [
      pdfHasContent(sow.proposalNumberSnapshot)
        ? `<div class="pdf-ref-row"><span>${esc(labels.proposalNo)}</span><strong>${text(
            sow.proposalNumberSnapshot,
          )}</strong></div>`
        : '',
      sow.agreedValueSnapshot != null
        ? `<div class="pdf-ref-row"><span>${esc(labels.agreedValue)}</span><strong>${esc(
            `${sow.currencySnapshot ? `${sow.currencySnapshot} ` : ''}${sow.agreedValueSnapshot.toLocaleString(
              undefined,
              { minimumFractionDigits: 2, maximumFractionDigits: 2 },
            )}`,
          )}</strong></div>`
        : '',
      pdfHasContent(sow.paymentTermsSnapshot)
        ? `<div class="pdf-ref-row"><span>${esc(labels.paymentTerms)}</span><strong>${text(
            sow.paymentTermsSnapshot,
          )}</strong></div>`
        : '',
    ].filter(Boolean);
    if (rows.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.commercialReference)}</section>`,
        sectionTitle: labels.commercialReference,
        keepWithNext: true,
      });
      blocks.push({
        key: nextKey('ref'),
        html: `<div class="pdf-ref">${rows.join('')}</div>`,
        sectionTitle: labels.commercialReference,
      });
    }
  }

  pushProse(blocks, nextKey, labels.terms, sow.termsAndConditions);

  // Signatures — blank lines, never fake signatures
  {
    const box = (party: string, name: string, title: string) => `
      <div class="pdf-sign-box">
        <p class="pdf-sign-party">${esc(party)}</p>
        <div class="pdf-sign-field">
          <div class="pdf-sign-line"></div>
          <div class="k">${esc(labels.signatureLine)}</div>
        </div>
        <div class="pdf-sign-field">
          <div class="k">${esc(labels.signatoryName)}</div>
          <div class="v">${text(name) || '<span class="pdf-sign-blank"></span>'}</div>
        </div>
        <div class="pdf-sign-field">
          <div class="k">${esc(labels.signatoryTitle)}</div>
          <div class="v">${text(title) || '<span class="pdf-sign-blank"></span>'}</div>
        </div>
        <div class="pdf-sign-field">
          <div class="k">${esc(labels.dateLine)}</div>
          <div class="v"><span class="pdf-sign-blank"></span></div>
        </div>
      </div>`;
    blocks.push({
      key: nextKey('head'),
      pageBreakBefore: true,
      html: `<section class="pdf-section-start">${sectionHead(labels.signatures)}</section>`,
      sectionTitle: labels.signatures,
      keepWithNext: true,
    });
    blocks.push({
      key: nextKey('sign'),
      html: `<div class="pdf-sign-grid">${box(
        labels.provider,
        sow.rootacaSignatoryName,
        sow.rootacaSignatoryTitle,
      )}${box(labels.client, sow.schoolSignatoryName, sow.schoolSignatoryTitle)}</div>
      <div class="pdf-meta-block">${esc(labels.documentTitle)} · ${esc(sow.sowNumber)} · ${esc(
        labels.version,
      )} ${esc(sow.version)} · ${esc(labels.organization)} · ${esc(labels.initiative)}</div>`,
      sectionTitle: labels.signatures,
    });
  }

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
  labels: SowPdfLabels;
  sow: PartnershipSow;
}): string {
  const { logo, brand, documentTitle, body, pageIndex, isCover, labels, sow } = options;
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
    `${labels.sowNo} ${sow.sowNumber}`,
    `${labels.version} ${sow.version}`,
  ];
  return `
  <section class="pdf-page" data-page="${pageIndex}">
    <header class="pdf-header">
      <div class="pdf-header-brand">
        <img src="${logo}" alt="${esc(brand)}" class="pdf-header-logo" />
        <span>${esc(brand)}</span>
      </div>
      <div class="pdf-header-doc">${esc(documentTitle)} · ${esc(sow.sowNumber)}</div>
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
 * Formal execution-focused Statement of Work PDF HTML. Uses only stored SOW
 * content and frozen snapshots — no invented deliverables, legal text, or
 * signatures. Empty sections are omitted.
 */
export async function buildSowPdfHtml(
  sow: PartnershipSow,
  labels: SowPdfLabels,
  options: SowPdfOptions,
): Promise<string> {
  const logo = ROOTACA_LOGO_DATA_URI;
  const autoPrint = options.autoPrint === true;
  const css = buildCss();
  const schoolName = sow.institution?.name || sow.institutionName || sow.clientName || '';

  const controlRows = [
    [labels.sowNo, sow.sowNumber],
    [labels.status, options.statusLabel(sow.status)],
    [labels.version, sow.version],
    [labels.date, formatDate(sow.sowDate)],
    [labels.effectiveDate, formatDate(sow.effectiveDate)],
    [labels.startDate, formatDate(sow.startDate)],
    [labels.endDate, formatDate(sow.endDate)],
    [labels.preparedBy, sow.preparedBy],
    [labels.approvedBy, sow.approvedBy],
  ]
    .filter(([, v]) => pdfHasContent(v))
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v!.trim())}</td></tr>`)
    .join('');

  const providerLines = [
    `<p><strong>${esc(labels.organization)}</strong></p>`,
    pdfHasContent(sow.rootacaSignatoryName) ? `<p>${text(sow.rootacaSignatoryName)}</p>` : '',
    pdfHasContent(sow.rootacaSignatoryTitle) ? `<p>${text(sow.rootacaSignatoryTitle)}</p>` : '',
  ].filter(Boolean);
  const clientLines = [
    pdfHasContent(sow.clientName) ? `<p><strong>${text(sow.clientName)}</strong></p>` : '',
    pdfHasContent(sow.clientAddress) ? `<p>${text(sow.clientAddress)}</p>` : '',
    pdfHasContent(sow.primaryContactName) ? `<p>${text(sow.primaryContactName)}</p>` : '',
    pdfHasContent(sow.primaryContactEmail) ? `<p>${text(sow.primaryContactEmail)}</p>` : '',
  ].filter(Boolean);

  const coverBody = `
    <div class="cover">
      <div class="cover-band">
        <img class="cover-logo" src="${logo}" alt="${esc(labels.brand)}" />
        <p class="cover-brand">${esc(labels.brand)}</p>
        <h1 class="cover-doc-title">${esc(labels.documentTitle)}</h1>
        <p class="cover-initiative">${esc(labels.initiative)}</p>
      </div>
      <div class="cover-body">
        <h2 class="cover-sow-title">${esc(sow.title)}</h2>
        ${schoolName ? `<p class="cover-school">${esc(schoolName)}</p>` : ''}
        <p class="cover-control-title">${esc(labels.documentControl)}</p>
        <table class="cover-control"><tbody>${controlRows}</tbody></table>
        <div class="cover-parties">
          <div class="cover-party">
            <h4>${esc(labels.provider)}</h4>
            ${providerLines.join('')}
          </div>
          <div class="cover-party">
            <h4>${esc(labels.client)}</h4>
            ${clientLines.join('') || '<p>—</p>'}
          </div>
        </div>
        <div class="cover-foot">${esc(labels.confidential)} · ${esc(labels.organization)} · ${esc(
          labels.initiative,
        )}</div>
      </div>
    </div>`;

  const blocks = buildSowBlocks(sow, labels, options);
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
          )} · ${esc(sow.sowNumber)}</div></section></div>`,
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
      sow,
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
        sow,
      }),
    );
  });

  return `<!DOCTYPE html>
<html lang="${options.dir === 'rtl' ? 'ar' : 'en'}" dir="${options.dir}">
<head>
  <meta charset="utf-8" />
  <title>${esc(sow.sowNumber)} — ${esc(labels.documentTitle)}</title>
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

/** Opens a printable formal SOW PDF window. */
export function openSowPdfWindow(html: string): Window | null {
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
