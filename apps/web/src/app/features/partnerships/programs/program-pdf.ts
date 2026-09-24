import { PartnershipProgram } from '../partnership.models';
import { skillTags } from './program-display';
import { ROOTACA_LOGO_DATA_URI } from './rootaca-logo.data';
import { buildProgramPdfBlocks, packProgramPdfPages } from './program-pdf-layout';

export type ProgramPdfLabels = {
  brand: string;
  documentTitle: string;
  initiative: string;
  preparedFor: string;
  confidential: string;
  pageOf: string;
  overview: string;
  audience: string;
  objectives: string;
  curriculum: string;
  activities: string;
  projects: string;
  sampleProjects: string;
  finalProject: string;
  assessment: string;
  delivery: string;
  requirements: string;
  equipment: string;
  schoolReqs: string;
  outcomes: string;
  targetAge: string;
  targetGrades: string;
  level: string;
  profile: string;
  schoolValue: string;
  studentValue: string;
  expectedOutput: string;
  evaluation: string;
  skills: string;
  required: string;
  recommended: string;
  ctaTitle: string;
  ctaExplore: string;
  organization: string;
  continued: string;
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

function tagsHtml(raw: string | null | undefined): string {
  const tags = skillTags(raw);
  if (!tags.length) {
    return '';
  }
  return `<div class="pdf-tags">${tags.map((t) => `<span class="pdf-tag">${esc(t)}</span>`).join('')}</div>`;
}

function sectionTitle(title: string): string {
  return `
    <div class="pdf-section-head">
      <span class="pdf-accent-bar" aria-hidden="true"></span>
      <h2>${esc(title)}</h2>
    </div>`;
}

function valueCard(title: string, body: string): string {
  if (!body) {
    return '';
  }
  return `
    <article class="pdf-value-card">
      <h3>${esc(title)}</h3>
      <p>${body}</p>
    </article>`;
}

function factBlock(label: string, value: string): string {
  if (!value) {
    return '';
  }
  return `
    <div class="pdf-fact">
      <span class="pdf-fact-label">${esc(label)}</span>
      <strong class="pdf-fact-value">${value}</strong>
    </div>`;
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

function activityCard(name: string, description?: string | null, skills?: string | null): string {
  return `
    <article class="pdf-mini-card">
      <h3>${esc(name)}</h3>
      ${description && pdfHasContent(description) ? `<p>${esc(description.trim())}</p>` : ''}
      ${tagsHtml(skills)}
    </article>`;
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

function pageShell(options: {
  dir: 'rtl' | 'ltr';
  brand: string;
  documentTitle: string;
  logo: string;
  body: string;
  pageIndex: number;
  pageCount: number;
  isCover: boolean;
  labels: ProgramPdfLabels;
}): string {
  const { dir, brand, documentTitle, logo, body, pageIndex, pageCount, isCover, labels } = options;
  const pageLabel = labels.pageOf
    .replace('{current}', String(pageIndex))
    .replace('{total}', String(pageCount));

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
    .pdf-page--cover {
      justify-content: stretch;
    }
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
    .pdf-section-start {
      margin: 0 0 4px;
    }
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

    /* Cover */
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
      font-size: 36px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #10231b;
    }
    .cover-type {
      display: inline-flex;
      margin-top: 18px;
      padding: 6px 14px;
      border-radius: 999px;
      background: #e8f4ee;
      color: #1b6b4a;
      font-size: 12px;
      font-weight: 700;
    }
    .cover-desc {
      margin: 22px 0 0;
      max-width: 32rem;
      font-size: 14px;
      line-height: 1.6;
      color: #3d4f46;
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

    /* Sections */
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
      margin: 0 0 18px;
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
    .pdf-profile {
      margin-top: 4px;
      padding: 14px 16px;
      border-radius: 12px;
      border: 1px solid #e2e8e3;
      background: #f7f9f7;
    }
    .pdf-profile .pdf-fact-label { margin-bottom: 6px; }
    .pdf-profile p {
      margin: 0;
      font-size: 12.5px;
      line-height: 1.55;
      color: #3d4f46;
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
    .pdf-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }
    .pdf-tag, .pdf-pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 9px;
      border-radius: 999px;
      background: #e8f4ee;
      color: #145c3d;
      font-size: 10px;
      font-weight: 700;
    }
    .pdf-delivery {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .pdf-delivery .pdf-tag {
      padding: 8px 14px;
      font-size: 12px;
      background: #ffffff;
      border: 1px solid #d7e5dd;
      color: #1b6b4a;
    }
    .pdf-final {
      margin-top: 16px;
      padding: 20px 22px;
      border-radius: 16px;
      border: 1.5px solid #1b6b4a;
      background: linear-gradient(180deg, #f3faf6 0%, #ffffff 100%);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .pdf-final-kicker {
      margin: 0 0 8px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #1b6b4a;
    }
    .pdf-final h3 {
      margin: 0 0 10px;
      font-size: 18px;
      font-weight: 700;
      color: #10231b;
      letter-spacing: -0.02em;
    }
    .pdf-final p {
      margin: 0 0 10px;
      font-size: 12.5px;
      line-height: 1.55;
      color: #3d4f46;
    }
    .pdf-final p:last-child { margin-bottom: 0; }
    .pdf-final-meta {
      margin-top: 8px;
      padding-top: 10px;
      border-top: 1px solid #d7e5dd;
    }
    .pdf-final-meta strong {
      display: block;
      margin-bottom: 3px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #5d6f66;
    }
    .pdf-check-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .pdf-check-list + .pdf-check-list .pdf-check {
      border-top: 0;
      padding-top: 8px;
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
    .pdf-timeline .pdf-numbered {
      border-bottom: 0;
      position: relative;
      padding-block: 10px;
    }
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

/**
 * School-facing Program PDF HTML — independent of Admin page layout.
 * Uses measured block packing so preview and download share balanced A4 pages.
 */
export async function buildProgramPdfHtml(
  program: PartnershipProgram,
  labels: ProgramPdfLabels,
  options: {
    dir: 'rtl' | 'ltr';
    typeLabel: string;
    levelLabel: string;
    deliveryLabels: string[];
    autoPrint?: boolean;
  },
): Promise<string> {
  const logo = ROOTACA_LOGO_DATA_URI;
  const autoPrint = options.autoPrint === true;
  const css = buildCss();

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
      <h1 class="cover-program">${esc(program.name)}</h1>
      <span class="cover-type">${esc(options.typeLabel)}</span>
      ${
        pdfHasContent(program.shortDescription)
          ? `<p class="cover-desc">${esc(program.shortDescription!.trim())}</p>`
          : ''
      }
      <p class="cover-initiative">${esc(labels.initiative)}</p>
      <div class="cover-bottom">
        <div>
          <div class="cover-accent-line" aria-hidden="true"></div>
          <p class="cover-prepared" style="margin-top:14px">${esc(labels.preparedFor)}</p>
        </div>
      </div>
    </div>`;

  const blocks = buildProgramPdfBlocks(program, labels, {
    typeLabel: options.typeLabel,
    levelLabel: options.levelLabel,
    deliveryLabels: options.deliveryLabels,
  });

  const packed = await packProgramPdfPages(blocks, labels, css, options.dir);
  const bodyPages = packed.length
    ? packed
    : [
        {
          html: `<div class="pdf-page-body"><section class="pdf-section"><div class="pdf-cta"><h2>${esc(labels.ctaTitle)}</h2><p class="pdf-cta-brand">${esc(labels.brand)}</p><p class="pdf-cta-init">${esc(labels.initiative)}</p><p class="pdf-cta-explore">${esc(labels.ctaExplore)}</p></div></section></div>`,
        },
      ];

  const finalTotal = 1 + bodyPages.length;
  const sheets: string[] = [
    pageShell({
      dir: options.dir,
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
        dir: options.dir,
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
  <title>${esc(program.name)} — ${esc(labels.documentTitle)}</title>
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

/** ROOTACA_[ProgramName]_School_Partnership_Profile.pdf */
export function buildProgramPdfFilename(programName: string): string {
  const cleaned = programName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/[\s—–_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const base = cleaned || 'Program';
  return `ROOTACA_${base}_School_Partnership_Profile.pdf`;
}

/**
 * Opens a printable school-facing Program PDF window.
 */
export function openProgramPdfWindow(html: string): Window | null {
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
