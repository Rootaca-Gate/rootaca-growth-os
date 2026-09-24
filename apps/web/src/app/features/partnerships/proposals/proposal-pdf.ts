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
import { formatMoney } from './proposal-pricing';
import {
  formatSnapshotDuration,
  formatSnapshotGroupSize,
  snapshotItemTitle,
} from './proposal-display';
import {
  PartnershipProposal,
  ProposalOfferingLine,
  ProposalSnapshotItem,
} from './proposal.models';

export { downloadHtmlAsPdf } from '../programs/program-pdf-download';

export type ProposalPdfLabels = {
  brand: string;
  documentTitle: string;
  initiative: string;
  preparedFor: string;
  preparedBy: string;
  confidential: string;
  pageOf: string;
  proposalNo: string;
  date: string;
  validUntil: string;
  version: string;
  executiveSummary: string;
  schoolGoals: string;
  partnership: string;
  selectedOfferings: string;
  implementation: string;
  assessment: string;
  requirements: string;
  timeline: string;
  commercial: string;
  paymentTerms: string;
  nextSteps: string;
  terms: string;
  learningExperience: string;
  outcomes: string;
  offering: string;
  pricingBasis: string;
  qty: string;
  unitPrice: string;
  discount: string;
  subtotal: string;
  tax: string;
  grandTotal: string;
  school: string;
  schoolChallenge: string;
  schoolObjective: string;
  targetStudentGroup: string;
  successCriteria: string;
  partnershipObjective: string;
  deliveryFormat: string;
  deliveryMode: string;
  targetGrades: string;
  duration: string;
  sessions: string;
  sessionLength: string;
  level: string;
  groupSize: string;
  groups: string;
  programName: string;
  schoolValue: string;
  studentValue: string;
  required: string;
  recommended: string;
  ctaTitle: string;
  ctaExplore: string;
  organization: string;
  continued: string;
  minutes: string;
  customizedObjectives: string;
  customizedCurriculumNotes: string;
  specialRequirements: string;
  implementationNotes: string;
  deliveryNotes: string;
  curriculum: string;
  projects: string;
};

export type ProposalPdfOptions = {
  dir: 'rtl' | 'ltr';
  autoPrint?: boolean;
  deliveryFormatLabel: (value: PartnershipDeliveryFormat | null | undefined) => string;
  deliveryModeLabel: (value: PartnershipDeliveryMode | null | undefined) => string;
  durationUnitLabel: (value: PartnershipDurationUnit | null | undefined) => string;
  levelLabel: (value: PartnershipProgramLevel | null | undefined) => string;
  pricingModelLabel: (value: string | null | undefined) => string;
  discountTypeLabel: (value: string | null | undefined) => string;
  statusLabel: (value: string | null | undefined) => string;
  fallBackEnum: (value: string | null | undefined) => string;
};

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** True when a field should appear in the school-facing PDF. */
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

function pad2(n: number): string {
  return String(n).padStart(2, '0');
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

function numberedItem(index: number, title: string, description?: string | null, extra = ''): string {
  return `
    <div class="pdf-numbered">
      <div class="pdf-num">${pad2(index)}</div>
      <div class="pdf-numbered-body">
        <h3>${esc(title)}</h3>
        ${description && pdfHasContent(description) ? `<p>${esc(description.trim())}</p>` : ''}
        ${extra}
      </div>
    </div>`;
}

function checklistItem(label: string, priorityLabel: string, description?: string | null): string {
  return `
    <li class="pdf-check">
      <span class="pdf-check-mark" aria-hidden="true">✓</span>
      <div>
        <div class="pdf-check-row">
          <strong>${esc(label)}</strong>
          <span class="pdf-pill">${esc(priorityLabel)}</span>
        </div>
        ${description && pdfHasContent(description) ? `<p>${esc(description.trim())}</p>` : ''}
      </div>
    </li>`;
}

function usableItems(items: ProposalSnapshotItem[] | null | undefined): ProposalSnapshotItem[] {
  if (!items?.length) {
    return [];
  }
  return items.filter((item) => pdfHasContent(snapshotItemTitle(item)));
}

function pageShell(options: {
  brand: string;
  documentTitle: string;
  logo: string;
  body: string;
  pageIndex: number;
  pageCount: number;
  isCover: boolean;
  labels: ProposalPdfLabels;
}): string {
  const { brand, documentTitle, logo, body, pageIndex, isCover, labels } = options;
  const pageLabel = labels.pageOf
    .replace('{current}', String(pageIndex))
    .replace('{total}', String(options.pageCount));

  if (isCover) {
    return `<section class="pdf-page pdf-page--cover" data-page="${pageIndex}">${body}</section>`;
  }

  return `
  <section class="pdf-page" data-page="${pageIndex}">
    <header class="pdf-header">
      <div class="pdf-header-brand">
        <img src="${logo}" alt="${esc(brand)}" class="pdf-header-logo" />
        <span>${esc(brand)}</span>
      </div>
      <div class="pdf-header-doc">${esc(documentTitle)}</div>
    </header>
    <main class="pdf-main">${body}</main>
    <footer class="pdf-footer">
      <div class="pdf-footer-rule" aria-hidden="true"></div>
      <div class="pdf-footer-row">
        <div class="pdf-footer-copy">
          <div>${esc(labels.brand)} | ${esc(labels.initiative)}</div>
          <div>${esc(labels.documentTitle)}</div>
          <div class="pdf-footer-conf">${esc(labels.confidential)}</div>
        </div>
        <div class="pdf-footer-page">${esc(pageLabel)}</div>
      </div>
    </footer>
  </section>`;
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
    html[dir="rtl"] body,
    html[dir="rtl"] {
      font-family: "IBM Plex Sans Arabic", "Source Sans 3", "Segoe UI", Tahoma, Arial, sans-serif;
      letter-spacing: normal;
      word-spacing: normal;
    }
    html[dir="rtl"] .pdf-page,
    html[dir="rtl"] .pdf-page * {
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
      box-shadow: 0 8px 28px rgb(16 35 27 / 10%);
    }
    .pdf-page--cover { justify-content: stretch; }
    .pdf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 48px 12px;
      border-bottom: 1px solid #e2e8e3;
      flex: 0 0 auto;
    }
    .pdf-header-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #1b6b4a;
    }
    .pdf-header-logo {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      object-fit: cover;
      display: block;
    }
    .pdf-header-doc {
      font-size: 11px;
      font-weight: 500;
      color: #5d6f66;
      text-align: end;
      max-width: 55%;
    }
    .pdf-main {
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
      padding: 22px 48px 10px;
    }
    .pdf-page-body {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .pdf-section-start { margin: 0 0 4px; }
    .pdf-footer {
      flex: 0 0 auto;
      padding: 0 48px 18px;
      margin-top: auto;
    }
    .pdf-footer-rule {
      height: 1px;
      background: #e2e8e3;
      margin-bottom: 12px;
    }
    .pdf-footer-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
    }
    .pdf-footer-copy {
      font-size: 9px;
      line-height: 1.45;
      color: #5d6f66;
    }
    .pdf-footer-conf {
      margin-top: 2px;
      font-weight: 600;
      color: #8a9a91;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .pdf-footer-page {
      font-size: 10px;
      font-weight: 600;
      color: #14231c;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .cover {
      display: flex;
      flex-direction: column;
      min-height: 1123px;
      padding: 56px 56px 48px;
      position: relative;
      background:
        radial-gradient(ellipse 80% 50% at 100% 0%, #e8f4ee 0%, transparent 55%),
        linear-gradient(180deg, #ffffff 0%, #f7f9f7 100%);
    }
    html[dir="rtl"] .cover {
      background:
        radial-gradient(ellipse 80% 50% at 0% 0%, #e8f4ee 0%, transparent 55%),
        linear-gradient(180deg, #ffffff 0%, #f7f9f7 100%);
    }
    .cover-geo {
      position: absolute;
      inset-inline-end: 0;
      top: 120px;
      width: 180px;
      height: 180px;
      border: 1px solid #d7e5dd;
      border-radius: 32px;
      opacity: 0.55;
      transform: rotate(18deg);
      pointer-events: none;
    }
    .cover-geo-2 {
      position: absolute;
      inset-inline-end: 48px;
      bottom: 160px;
      width: 88px;
      height: 88px;
      border: 1px solid #c5d8cd;
      border-radius: 18px;
      opacity: 0.45;
      transform: rotate(-12deg);
      pointer-events: none;
    }
    .cover-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
    }
    .cover-logo {
      width: 88px;
      height: 88px;
      border-radius: 20px;
      object-fit: cover;
      display: block;
      box-shadow: 0 2px 8px rgb(16 35 27 / 8%);
    }
    .cover-brand {
      margin: 28px 0 0;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #1b6b4a;
    }
    .cover-doc-title {
      margin: 10px 0 0;
      font-size: 15px;
      font-weight: 600;
      color: #5d6f66;
      letter-spacing: -0.01em;
    }
    .cover-program {
      margin: 48px 0 0;
      max-width: 34rem;
      font-size: 34px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #10231b;
    }
    .cover-school {
      margin: 16px 0 0;
      font-size: 16px;
      font-weight: 600;
      color: #1b6b4a;
    }
    .cover-meta {
      margin: 22px 0 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 18px;
      max-width: 28rem;
    }
    .cover-meta-item span {
      display: block;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #8a9a91;
      margin-bottom: 3px;
    }
    .cover-meta-item strong {
      font-size: 13px;
      font-weight: 700;
      color: #14231c;
    }
    .cover-initiative {
      margin-top: 36px;
      font-size: 12px;
      font-weight: 600;
      color: #5d6f66;
    }
    .cover-bottom {
      margin-top: auto;
      padding-top: 48px;
      border-top: 1px solid #e2e8e3;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .cover-prepared {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #8a9a91;
    }
    .cover-accent-line {
      width: 64px;
      height: 3px;
      background: #1b6b4a;
      border-radius: 2px;
    }
    .pdf-section {
      margin: 0 0 18px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .pdf-section:last-child { margin-bottom: 0; }
    .pdf-section-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 12px;
    }
    .pdf-accent-bar {
      width: 4px;
      height: 18px;
      border-radius: 2px;
      background: #1b6b4a;
      flex: 0 0 auto;
    }
    .pdf-section-head h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #10231b;
    }
    .pdf-lead {
      margin: 0 0 14px;
      font-size: 13px;
      line-height: 1.65;
      color: #3d4f46;
    }
    .pdf-value-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .pdf-value-card {
      padding: 16px 18px;
      border: 1px solid #e2e8e3;
      border-radius: 14px;
      background: #f7f9f7;
    }
    .pdf-value-card h3 {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 700;
      color: #1b6b4a;
      letter-spacing: 0.02em;
    }
    .pdf-value-card p {
      margin: 0;
      font-size: 12.5px;
      line-height: 1.55;
      color: #3d4f46;
    }
    .pdf-facts {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 14px;
    }
    .pdf-facts--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pdf-fact {
      padding: 14px 16px;
      border: 1px solid #e2e8e3;
      border-radius: 12px;
      background: #ffffff;
    }
    .pdf-fact-label {
      display: block;
      margin-bottom: 6px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #8a9a91;
    }
    .pdf-fact-value {
      display: block;
      font-size: 15px;
      font-weight: 700;
      color: #14231c;
      line-height: 1.3;
    }
    .pdf-offering-title {
      margin: 0 0 10px;
      font-size: 16px;
      font-weight: 700;
      color: #10231b;
      letter-spacing: -0.02em;
    }
    .pdf-offering-program {
      margin: 0 0 12px;
      font-size: 12px;
      font-weight: 600;
      color: #5d6f66;
    }
    .pdf-numbered {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid #eef2ef;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .pdf-numbered:last-child { border-bottom: 0; }
    .pdf-num {
      flex: 0 0 36px;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #1b6b4a;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .pdf-numbered-body h3 {
      margin: 2px 0 4px;
      font-size: 13.5px;
      font-weight: 700;
      color: #14231c;
    }
    .pdf-numbered-body p {
      margin: 0;
      font-size: 12px;
      line-height: 1.55;
      color: #3d4f46;
    }
    .pdf-card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .pdf-mini-card {
      padding: 14px 16px;
      border: 1px solid #e2e8e3;
      border-radius: 12px;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .pdf-mini-card h3 {
      margin: 0 0 6px;
      font-size: 13px;
      font-weight: 700;
      color: #14231c;
    }
    .pdf-mini-card p {
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
      color: #3d4f46;
    }
    .pdf-pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 9px;
      border-radius: 999px;
      background: #e8f4ee;
      color: #145c3d;
      font-size: 10px;
      font-weight: 700;
    }
    .pdf-check-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .pdf-check {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 10px 0;
      border-bottom: 1px solid #eef2ef;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .pdf-check:last-child { border-bottom: 0; }
    .pdf-check-mark {
      flex: 0 0 22px;
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: #e8f4ee;
      color: #1b6b4a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      margin-top: 1px;
    }
    .pdf-check-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .pdf-check strong {
      font-size: 13px;
      color: #14231c;
    }
    .pdf-check p {
      margin: 4px 0 0;
      font-size: 12px;
      color: #3d4f46;
      line-height: 1.5;
    }
    .pdf-subhead {
      margin: 18px 0 10px;
      font-size: 12px;
      font-weight: 700;
      color: #5d6f66;
      letter-spacing: 0.02em;
    }
    .pdf-subhead:first-child { margin-top: 0; }
    .pdf-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
      margin: 0 0 14px;
    }
    .pdf-table th {
      text-align: start;
      padding: 10px 8px;
      border-bottom: 1.5px solid #1b6b4a;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #5d6f66;
    }
    .pdf-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #eef2ef;
      color: #14231c;
      vertical-align: top;
    }
    .pdf-table .num {
      text-align: end;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .pdf-totals {
      margin-top: 8px;
      margin-inline-start: auto;
      width: min(280px, 100%);
      border: 1px solid #e2e8e3;
      border-radius: 12px;
      overflow: hidden;
    }
    .pdf-totals-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      border-bottom: 1px solid #eef2ef;
      font-size: 12px;
    }
    .pdf-totals-row:last-child { border-bottom: 0; }
    .pdf-totals-row span { color: #5d6f66; }
    .pdf-totals-row strong {
      font-variant-numeric: tabular-nums;
      color: #14231c;
    }
    .pdf-totals-row--grand {
      background: #10231b;
      color: #fff;
    }
    .pdf-totals-row--grand span,
    .pdf-totals-row--grand strong { color: #fff; }
    .pdf-cta {
      margin-top: 8px;
      padding: 28px 24px;
      border-radius: 16px;
      background: #10231b;
      color: #d7e5dd;
      text-align: center;
    }
    .pdf-cta h2 {
      margin: 0 0 10px;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ffffff;
      line-height: 1.3;
    }
    .pdf-cta-brand {
      margin: 0 0 4px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #8fd4b0;
    }
    .pdf-cta-init {
      margin: 0 0 14px;
      font-size: 12px;
      color: #8aa396;
    }
    .pdf-cta-explore {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: #d7e5dd;
    }
    .pdf-meta-block {
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px solid #e2e8e3;
      font-size: 9px;
      line-height: 1.5;
      color: #8a9a91;
    }
  `;
}

function money(value: number | null | undefined, currency: string | null | undefined): string {
  return formatMoney(value, currency, '');
}

function lineDiscountLabel(
  line: ProposalOfferingLine,
  options: ProposalPdfOptions,
  currency: string | null,
): string {
  if (line.discountType === 'NONE' || line.discountValue == null) {
    return '';
  }
  if (line.discountType === 'PERCENTAGE') {
    return `${line.discountValue}%`;
  }
  return money(line.discountValue, currency) || String(line.discountValue);
}

function pushProseSection(
  blocks: PdfBlock[],
  nextKey: (prefix: string) => string,
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

function pushOfferingBlocks(
  blocks: PdfBlock[],
  nextKey: (prefix: string) => string,
  line: ProposalOfferingLine,
  index: number,
  labels: ProposalPdfLabels,
  options: ProposalPdfOptions,
): void {
  const section = labels.selectedOfferings;
  blocks.push({
    key: nextKey('off-head'),
    html: `<section class="pdf-section-start">${
      index === 0 ? sectionHead(section) : ''
    }<h3 class="pdf-offering-title">${esc(line.snapshotOfferingName)}</h3>
      <p class="pdf-offering-program">${esc(labels.programName)}: ${esc(
        line.snapshotProgramName,
      )}</p></section>`,
    sectionTitle: section,
    keepWithNext: true,
    pageBreakBefore: index > 0,
  });

  const duration =
    formatSnapshotDuration(line, (u) => options.durationUnitLabel(u)) || '';
  const groupSize = formatSnapshotGroupSize(line) || '';
  const facts = [
    options.deliveryFormatLabel(line.snapshotDeliveryFormat)
      ? factHtml(
          labels.deliveryFormat,
          esc(options.deliveryFormatLabel(line.snapshotDeliveryFormat)),
        )
      : '',
    line.snapshotDeliveryMode && options.deliveryModeLabel(line.snapshotDeliveryMode)
      ? factHtml(
          labels.deliveryMode,
          esc(options.deliveryModeLabel(line.snapshotDeliveryMode)),
        )
      : '',
    text(line.snapshotTargetGrades)
      ? factHtml(labels.targetGrades, text(line.snapshotTargetGrades))
      : '',
    line.snapshotRecommendedLevel && options.levelLabel(line.snapshotRecommendedLevel)
      ? factHtml(labels.level, esc(options.levelLabel(line.snapshotRecommendedLevel)))
      : '',
    duration ? factHtml(labels.duration, esc(duration)) : '',
    line.snapshotNumberOfSessions != null
      ? factHtml(labels.sessions, String(line.snapshotNumberOfSessions))
      : '',
    line.snapshotSessionDurationMinutes != null
      ? factHtml(
          labels.sessionLength,
          `${line.snapshotSessionDurationMinutes}${
            labels.minutes ? ` ${esc(labels.minutes)}` : ''
          }`,
        )
      : '',
    groupSize ? factHtml(labels.groupSize, esc(groupSize)) : '',
    line.snapshotNumberOfGroups != null
      ? factHtml(labels.groups, String(line.snapshotNumberOfGroups))
      : '',
  ].filter(Boolean);

  if (facts.length) {
    blocks.push({
      key: nextKey('off-facts'),
      html: `<div class="pdf-facts">${facts.join('')}</div>`,
      sectionTitle: section,
    });
  }

  if (pdfHasContent(line.snapshotShortDescription)) {
    blocks.push({
      key: nextKey('off-desc'),
      html: `<p class="pdf-lead">${esc(line.snapshotShortDescription.trim())}</p>`,
      sectionTitle: section,
    });
  }

  const valueCards = [
    pdfHasContent(line.snapshotSchoolValue)
      ? `<article class="pdf-value-card"><h3>${esc(labels.schoolValue)}</h3><p>${esc(
          line.snapshotSchoolValue.trim(),
        )}</p></article>`
      : '',
    pdfHasContent(line.snapshotStudentValue)
      ? `<article class="pdf-value-card"><h3>${esc(labels.studentValue)}</h3><p>${esc(
          line.snapshotStudentValue.trim(),
        )}</p></article>`
      : '',
  ].filter(Boolean);
  if (valueCards.length) {
    blocks.push({
      key: nextKey('off-values'),
      html: `<div class="pdf-value-grid">${valueCards.join('')}</div>`,
      sectionTitle: section,
    });
  }

  const customNotes = [
    pdfHasContent(line.customizedObjectives)
      ? `<article class="pdf-value-card"><h3>${esc(labels.customizedObjectives)}</h3><p>${esc(
          line.customizedObjectives.trim(),
        )}</p></article>`
      : '',
    pdfHasContent(line.customizedCurriculumNotes)
      ? `<article class="pdf-value-card"><h3>${esc(labels.customizedCurriculumNotes)}</h3><p>${esc(
          line.customizedCurriculumNotes.trim(),
        )}</p></article>`
      : '',
    pdfHasContent(line.specialRequirements)
      ? `<article class="pdf-value-card"><h3>${esc(labels.specialRequirements)}</h3><p>${esc(
          line.specialRequirements.trim(),
        )}</p></article>`
      : '',
    pdfHasContent(line.implementationNotes)
      ? `<article class="pdf-value-card"><h3>${esc(labels.implementationNotes)}</h3><p>${esc(
          line.implementationNotes.trim(),
        )}</p></article>`
      : '',
    pdfHasContent(line.deliveryNotes)
      ? `<article class="pdf-value-card"><h3>${esc(labels.deliveryNotes)}</h3><p>${esc(
          line.deliveryNotes.trim(),
        )}</p></article>`
      : '',
  ].filter(Boolean);
  for (let i = 0; i < customNotes.length; i += 2) {
    blocks.push({
      key: nextKey('off-custom'),
      html: `<div class="pdf-value-grid">${customNotes.slice(i, i + 2).join('')}</div>`,
      sectionTitle: section,
    });
  }

  const objectives = usableItems(line.snapshotObjectivesJson);
  const activities = usableItems(line.snapshotActivitiesJson);
  if (objectives.length || activities.length) {
    blocks.push({
      key: nextKey('learn-head'),
      html: `<h3 class="pdf-subhead">${esc(labels.learningExperience)}</h3>`,
      sectionTitle: section,
      keepWithNext: true,
    });
  }
  objectives.forEach((item, i) => {
    blocks.push({
      key: nextKey('obj'),
      html: numberedItem(i + 1, snapshotItemTitle(item), item.description),
      sectionTitle: section,
    });
  });
  for (let i = 0; i < activities.length; i += 2) {
    const pair = activities.slice(i, i + 2);
    blocks.push({
      key: nextKey('act'),
      html: `<div class="pdf-card-grid">${pair
        .map(
          (item) => `
        <article class="pdf-mini-card">
          <h3>${esc(snapshotItemTitle(item))}</h3>
          ${pdfHasContent(item.description) ? `<p>${esc(item.description!.trim())}</p>` : ''}
        </article>`,
        )
        .join('')}</div>`,
      sectionTitle: section,
    });
  }

  const curriculum = usableItems(line.snapshotCurriculumJson);
  curriculum.forEach((item, i) => {
    if (i === 0) {
      blocks.push({
        key: nextKey('cur-head'),
        html: `<h3 class="pdf-subhead">${esc(labels.curriculum)}</h3>`,
        sectionTitle: section,
        keepWithNext: true,
      });
    }
    blocks.push({
      key: nextKey('cur'),
      html: numberedItem(i + 1, snapshotItemTitle(item), item.description),
      sectionTitle: section,
    });
  });

  const projects = usableItems(line.snapshotProjectsJson);
  for (let i = 0; i < projects.length; i += 2) {
    if (i === 0) {
      blocks.push({
        key: nextKey('proj-head'),
        html: `<h3 class="pdf-subhead">${esc(labels.projects)}</h3>`,
        sectionTitle: section,
        keepWithNext: true,
      });
    }
    const pair = projects.slice(i, i + 2);
    blocks.push({
      key: nextKey('proj'),
      html: `<div class="pdf-card-grid">${pair
        .map(
          (item) => `
        <article class="pdf-mini-card">
          <h3>${esc(snapshotItemTitle(item))}</h3>
          ${pdfHasContent(item.description) ? `<p>${esc(item.description!.trim())}</p>` : ''}
          ${
            pdfHasContent(item.expectedOutput)
              ? `<p>${esc(item.expectedOutput!.trim())}</p>`
              : ''
          }
        </article>`,
        )
        .join('')}</div>`,
      sectionTitle: section,
    });
  }

  const assessments = usableItems(line.snapshotAssessmentJson).filter(
    (item) => item.enabled !== false,
  );
  assessments.forEach((item, i) => {
    if (i === 0) {
      blocks.push({
        key: nextKey('assess-head'),
        html: `<h3 class="pdf-subhead">${esc(labels.assessment)}</h3>`,
        sectionTitle: section,
        keepWithNext: true,
      });
    }
    blocks.push({
      key: nextKey('assess'),
      html: numberedItem(i + 1, snapshotItemTitle(item), item.description),
      sectionTitle: section,
    });
  });

  const requirements = usableItems(line.snapshotRequirementsJson);
  requirements.forEach((item) => {
    blocks.push({
      key: nextKey('req'),
      html: `<ul class="pdf-check-list">${checklistItem(
        snapshotItemTitle(item),
        item.priority === 'RECOMMENDED' ? labels.recommended : labels.required,
        item.description,
      )}</ul>`,
      sectionTitle: section,
    });
  });

  const outcomes = usableItems(line.snapshotOutcomesJson);
  outcomes.forEach((item, i) => {
    if (i === 0) {
      blocks.push({
        key: nextKey('out-head'),
        html: `<h3 class="pdf-subhead">${esc(labels.outcomes)}</h3>`,
        sectionTitle: section,
        keepWithNext: true,
      });
    }
    blocks.push({
      key: nextKey('out'),
      html: numberedItem(i + 1, snapshotItemTitle(item), item.description),
      sectionTitle: section,
    });
  });
}

function buildProposalBlocks(
  proposal: PartnershipProposal,
  labels: ProposalPdfLabels,
  options: ProposalPdfOptions,
): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  let seq = 0;
  const nextKey = (prefix: string) => `${prefix}-${seq++}`;

  pushProseSection(blocks, nextKey, labels.executiveSummary, proposal.executiveSummary);

  {
    const schoolCards = [
      pdfHasContent(proposal.schoolChallenge)
        ? `<article class="pdf-value-card"><h3>${esc(labels.schoolChallenge)}</h3><p>${esc(
            proposal.schoolChallenge.trim(),
          )}</p></article>`
        : '',
      pdfHasContent(proposal.schoolObjective)
        ? `<article class="pdf-value-card"><h3>${esc(labels.schoolObjective)}</h3><p>${esc(
            proposal.schoolObjective.trim(),
          )}</p></article>`
        : '',
      pdfHasContent(proposal.targetStudentGroup)
        ? `<article class="pdf-value-card"><h3>${esc(labels.targetStudentGroup)}</h3><p>${esc(
            proposal.targetStudentGroup.trim(),
          )}</p></article>`
        : '',
      pdfHasContent(proposal.successCriteria)
        ? `<article class="pdf-value-card"><h3>${esc(labels.successCriteria)}</h3><p>${esc(
            proposal.successCriteria.trim(),
          )}</p></article>`
        : '',
    ].filter(Boolean);
    if (schoolCards.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.schoolGoals)}</section>`,
        sectionTitle: labels.schoolGoals,
        keepWithNext: true,
      });
      for (let i = 0; i < schoolCards.length; i += 2) {
        blocks.push({
          key: nextKey('school'),
          html: `<div class="pdf-value-grid">${schoolCards.slice(i, i + 2).join('')}</div>`,
          sectionTitle: labels.schoolGoals,
        });
      }
    }
  }

  pushProseSection(blocks, nextKey, labels.partnership, proposal.partnershipObjective);

  const offerings = [...(proposal.offerings ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  offerings.forEach((line, index) => {
    pushOfferingBlocks(blocks, nextKey, line, index, labels, options);
  });

  pushProseSection(blocks, nextKey, labels.implementation, proposal.implementationApproach);

  {
    const phases = (proposal.timelinePhases ?? []).filter((p) => pdfHasContent(p.title));
    const hasTimeline =
      phases.length > 0 ||
      pdfHasContent(proposal.timelineNotes) ||
      pdfHasContent(proposal.startDate) ||
      pdfHasContent(proposal.endDate);
    if (hasTimeline) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.timeline)}</section>`,
        sectionTitle: labels.timeline,
        keepWithNext: true,
      });
      const dateFacts = [
        formatDate(proposal.startDate)
          ? factHtml(labels.date, esc(formatDate(proposal.startDate)))
          : '',
        formatDate(proposal.endDate)
          ? factHtml(labels.validUntil, esc(formatDate(proposal.endDate)))
          : '',
      ].filter(Boolean);
      if (dateFacts.length) {
        blocks.push({
          key: nextKey('tl-dates'),
          html: `<div class="pdf-facts pdf-facts--2">${dateFacts.join('')}</div>`,
          sectionTitle: labels.timeline,
        });
      }
      if (pdfHasContent(proposal.timelineNotes)) {
        blocks.push({
          key: nextKey('tl-notes'),
          html: `<p class="pdf-lead">${esc(proposal.timelineNotes.trim())}</p>`,
          sectionTitle: labels.timeline,
        });
      }
      phases.forEach((phase, i) => {
        const range = [formatDate(phase.startDate), formatDate(phase.endDate)]
          .filter(Boolean)
          .join(' → ');
        blocks.push({
          key: nextKey('phase'),
          html: numberedItem(
            i + 1,
            phase.title,
            [phase.description, range].filter((v) => pdfHasContent(v)).join('\n'),
          ),
          sectionTitle: labels.timeline,
        });
      });
    }
  }

  {
    const outcomes = (proposal.customOutcomes ?? []).filter((o) => pdfHasContent(o.title));
    if (outcomes.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.outcomes)}</section>`,
        sectionTitle: labels.outcomes,
        keepWithNext: true,
      });
      outcomes.forEach((outcome, i) => {
        blocks.push({
          key: nextKey('cout'),
          html: numberedItem(i + 1, outcome.title, outcome.description),
          sectionTitle: labels.outcomes,
        });
      });
    }
  }

  // Commercial table — only when at least one priced field exists
  {
    const hasCommercial =
      offerings.some(
        (line) =>
          line.quantity != null ||
          line.unitPrice != null ||
          line.lineSubtotal != null ||
          options.pricingModelLabel(line.pricingModel),
      ) ||
      proposal.subtotal != null ||
      proposal.grandTotal != null;

    if (hasCommercial && offerings.length) {
      blocks.push({
        key: nextKey('head'),
        html: `<section class="pdf-section-start">${sectionHead(labels.commercial)}</section>`,
        sectionTitle: labels.commercial,
        keepWithNext: true,
      });

      const rows = offerings
        .map((line) => {
          const discount = lineDiscountLabel(line, options, proposal.currency);
          return `<tr>
            <td>${esc(line.snapshotOfferingName)}</td>
            <td>${esc(options.pricingModelLabel(line.pricingModel) || '')}</td>
            <td class="num">${line.quantity != null ? esc(String(line.quantity)) : ''}</td>
            <td class="num">${esc(money(line.unitPrice, proposal.currency))}</td>
            <td class="num">${esc(discount)}</td>
            <td class="num">${esc(money(line.lineSubtotal, proposal.currency))}</td>
          </tr>`;
        })
        .join('');

      blocks.push({
        key: nextKey('table'),
        html: `<table class="pdf-table">
          <thead>
            <tr>
              <th>${esc(labels.offering)}</th>
              <th>${esc(labels.pricingBasis)}</th>
              <th class="num">${esc(labels.qty)}</th>
              <th class="num">${esc(labels.unitPrice)}</th>
              <th class="num">${esc(labels.discount)}</th>
              <th class="num">${esc(labels.subtotal)}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`,
        sectionTitle: labels.commercial,
      });

      const totalsRows = [
        proposal.subtotal != null
          ? `<div class="pdf-totals-row"><span>${esc(labels.subtotal)}</span><strong>${esc(
              money(proposal.subtotal, proposal.currency),
            )}</strong></div>`
          : '',
        proposal.discountAmount != null && proposal.discountAmount > 0
          ? `<div class="pdf-totals-row"><span>${esc(labels.discount)}</span><strong>${esc(
              money(proposal.discountAmount, proposal.currency),
            )}</strong></div>`
          : '',
        proposal.taxAmount != null
          ? `<div class="pdf-totals-row"><span>${esc(labels.tax)}</span><strong>${esc(
              money(proposal.taxAmount, proposal.currency),
            )}</strong></div>`
          : '',
        proposal.grandTotal != null
          ? `<div class="pdf-totals-row pdf-totals-row--grand"><span>${esc(
              labels.grandTotal,
            )}</span><strong>${esc(money(proposal.grandTotal, proposal.currency))}</strong></div>`
          : '',
      ].filter(Boolean);

      if (totalsRows.length) {
        blocks.push({
          key: nextKey('totals'),
          html: `<div class="pdf-totals">${totalsRows.join('')}</div>`,
          sectionTitle: labels.commercial,
        });
      }
    }
  }

  pushProseSection(blocks, nextKey, labels.paymentTerms, proposal.paymentTerms);
  pushProseSection(blocks, nextKey, labels.nextSteps, proposal.nextSteps);
  pushProseSection(blocks, nextKey, labels.terms, proposal.termsAndConditions);

  blocks.push({
    key: nextKey('cta'),
    pageBreakBefore: true,
    html: `
      <section class="pdf-section">
        <div class="pdf-cta">
          <h2>${esc(labels.ctaTitle)}</h2>
          <p class="pdf-cta-brand">${esc(labels.brand)}</p>
          <p class="pdf-cta-init">${esc(labels.initiative)}</p>
          <p class="pdf-cta-explore">${esc(labels.ctaExplore)}</p>
        </div>
        <div class="pdf-meta-block">
          ${esc(labels.documentTitle)} · ${esc(proposal.title)} · ${esc(labels.organization)} · ${esc(
            labels.initiative,
          )}
        </div>
      </section>`,
  });

  return blocks;
}

/**
 * School-facing Proposal PDF HTML. Uses frozen offering snapshots and commercial
 * totals only — no IDs, internal notes, or invented data.
 */
export async function buildProposalPdfHtml(
  proposal: PartnershipProposal,
  labels: ProposalPdfLabels,
  options: ProposalPdfOptions,
): Promise<string> {
  const logo = ROOTACA_LOGO_DATA_URI;
  const autoPrint = options.autoPrint === true;
  const css = buildCss();
  const schoolName =
    proposal.institution?.name ||
    proposal.institutionName ||
    '';

  const coverMeta = [
    pdfHasContent(proposal.proposalNumber)
      ? `<div class="cover-meta-item"><span>${esc(labels.proposalNo)}</span><strong>${esc(
          proposal.proposalNumber,
        )}</strong></div>`
      : '',
    formatDate(proposal.proposalDate)
      ? `<div class="cover-meta-item"><span>${esc(labels.date)}</span><strong>${esc(
          formatDate(proposal.proposalDate),
        )}</strong></div>`
      : '',
    formatDate(proposal.validUntil)
      ? `<div class="cover-meta-item"><span>${esc(labels.validUntil)}</span><strong>${esc(
          formatDate(proposal.validUntil),
        )}</strong></div>`
      : '',
    pdfHasContent(proposal.version)
      ? `<div class="cover-meta-item"><span>${esc(labels.version)}</span><strong>${esc(
          proposal.version,
        )}</strong></div>`
      : '',
    pdfHasContent(proposal.preparedBy)
      ? `<div class="cover-meta-item"><span>${esc(labels.preparedBy)}</span><strong>${esc(
          proposal.preparedBy.trim(),
        )}</strong></div>`
      : '',
  ].filter(Boolean);

  const coverBody = `
    <div class="cover">
      <div class="cover-geo" aria-hidden="true"></div>
      <div class="cover-geo-2" aria-hidden="true"></div>
      <div class="cover-top">
        <div>
          <img class="cover-logo" src="${logo}" alt="${esc(labels.brand)}" />
          <p class="cover-brand">${esc(labels.brand)}</p>
          <p class="cover-doc-title">${esc(labels.documentTitle)}</p>
        </div>
      </div>
      <h1 class="cover-program">${esc(proposal.title)}</h1>
      ${schoolName ? `<p class="cover-school">${esc(labels.school)}: ${esc(schoolName)}</p>` : ''}
      ${coverMeta.length ? `<div class="cover-meta">${coverMeta.join('')}</div>` : ''}
      <p class="cover-initiative">${esc(labels.initiative)}</p>
      <div class="cover-bottom">
        <div>
          <div class="cover-accent-line" aria-hidden="true"></div>
          <p class="cover-prepared" style="margin-top:14px">${esc(labels.preparedFor)}${
            schoolName ? `: ${esc(schoolName)}` : ''
          }</p>
        </div>
      </div>
    </div>`;

  const blocks = buildProposalBlocks(proposal, labels, options);
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
          html: `<div class="pdf-page-body"><section class="pdf-section"><div class="pdf-cta"><h2>${esc(
            labels.ctaTitle,
          )}</h2><p class="pdf-cta-brand">${esc(labels.brand)}</p><p class="pdf-cta-init">${esc(
            labels.initiative,
          )}</p><p class="pdf-cta-explore">${esc(labels.ctaExplore)}</p></div></section></div>`,
        },
      ];

  const finalTotal = 1 + bodyPages.length;
  const sheets: string[] = [
    pageShell({
      brand: labels.brand,
      documentTitle: labels.documentTitle,
      logo,
      body: coverBody,
      pageIndex: 1,
      pageCount: finalTotal,
      isCover: true,
      labels,
    }),
  ];

  bodyPages.forEach((page, index) => {
    sheets.push(
      pageShell({
        brand: labels.brand,
        documentTitle: labels.documentTitle,
        logo,
        body: page.html,
        pageIndex: index + 2,
        pageCount: finalTotal,
        isCover: false,
        labels,
      }),
    );
  });

  return `<!DOCTYPE html>
<html lang="${options.dir === 'rtl' ? 'ar' : 'en'}" dir="${options.dir}">
<head>
  <meta charset="utf-8" />
  <title>${esc(proposal.title)} — ${esc(labels.documentTitle)}</title>
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

/** ROOTACA_[School]_[Title]_Partnership_Proposal.pdf */
export function buildProposalPdfFilename(school: string, title: string): string {
  const clean = (value: string) =>
    value
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/[\s—–_]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  const schoolPart = clean(school) || 'School';
  const titlePart = clean(title) || 'Proposal';
  return `ROOTACA_${schoolPart}_${titlePart}_Partnership_Proposal.pdf`;
}

/** Opens a printable school-facing Proposal PDF window. */
export function openProposalPdfWindow(html: string): Window | null {
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
