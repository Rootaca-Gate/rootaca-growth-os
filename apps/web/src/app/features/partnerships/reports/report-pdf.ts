import { ROOTACA_LOGO_DATA_URI } from '../programs/rootaca-logo.data';
import { packProgramPdfPages, type PdfBlock } from '../programs/program-pdf-layout';
import type { ProgramPdfLabels } from '../programs/program-pdf';
import { pdfHasContent } from '../programs/program-pdf';
import { formatCount, formatPeriod, formatPercent } from './report-display';
import { PartnershipReport } from './report.models';

export { downloadHtmlAsPdf } from '../programs/program-pdf-download';

export type ReportPdfLabels = {
  brand: string;
  documentTitle: string;
  confidential: string;
  pageOf: string;
  continued: string;
  organization: string;
  reportNo: string;
  school: string;
  delivery: string;
  type: string;
  period: string;
  version: string;
  executiveSummary: string;
  achievements: string;
  nextSteps: string;
  recommendations: string;
  kpis: string;
  students: string;
  groups: string;
  projects: string;
  assessment: string;
  challenges: string;
  kpiStudents: string;
  kpiGroups: string;
  kpiAttendance: string;
  kpiCompletion: string;
  trackStatus: string;
  noData: string;
};

export type ReportPdfOptions = {
  dir: 'rtl' | 'ltr';
};

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCss(): string {
  return `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #e8ebe7; color: #14231c;
      font-family: "Source Sans 3", "IBM Plex Sans Arabic", Arial, sans-serif; }
    .pdf-doc { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 24px 0; }
    .pdf-page { width: 794px; min-height: 1123px; background: #fff; padding: 48px 56px; box-shadow: 0 8px 28px rgb(16 35 27 / 10%); }
    .pdf-section-head h2 { margin: 0 0 12px; font-size: 18px; color: #1a5c45; }
    .pdf-p, .pdf-ul { font-size: 14px; line-height: 1.55; }
    .pdf-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
    .pdf-table th, .pdf-table td { border-bottom: 1px solid #dde5df; padding: 6px 8px; text-align: start; }
    .cover { text-align: center; padding-top: 80px; }
    .cover-logo { width: 120px; height: auto; }
    .cover-title { font-size: 28px; margin: 24px 0 8px; }
    .cover-school { color: #4a6358; font-size: 18px; }
  `;
}

function buildReportBlocks(
  report: PartnershipReport,
  labels: ReportPdfLabels,
  schoolFacing: boolean,
): PdfBlock[] {
  const snap = report.dataSnapshot;
  const blocks: PdfBlock[] = [];
  let seq = 0;
  const key = (p: string) => `${p}-${seq++}`;

  blocks.push({
    key: key('cover'),
    html: `
      <div class="cover">
        <img class="cover-logo" src="${ROOTACA_LOGO_DATA_URI}" alt="${esc(labels.brand)}" />
        <h1 class="cover-title">${esc(labels.documentTitle)}</h1>
        <p class="cover-school">${esc(report.institutionName)}</p>
        <p>${esc(report.reportNumber)}</p>
      </div>`,
  });

  blocks.push({
    key: key('meta'),
    html: `
      <section class="pdf-section-start"><div class="pdf-section-head"><h2>${esc(labels.reportNo)}</h2></div>
      <ul class="pdf-ul">
        <li>${esc(labels.school)}: ${esc(report.institutionName)}</li>
        <li>${esc(labels.delivery)}: ${esc(report.deliveryNumber)}</li>
        <li>${esc(labels.period)}: ${esc(formatPeriod(report))}</li>
        <li>${esc(labels.version)}: ${esc(report.version)}</li>
      </ul></section>`,
    sectionTitle: labels.reportNo,
  });

  if (pdfHasContent(report.executiveSummary)) {
    blocks.push({
      key: key('exec'),
      html: `<section><div class="pdf-section-head"><h2>${esc(labels.executiveSummary)}</h2></div><p class="pdf-p">${esc(report.executiveSummary.trim())}</p></section>`,
      sectionTitle: labels.executiveSummary,
    });
  }

  if (snap?.kpis) {
    blocks.push({
      key: key('kpi'),
      html: `<section><div class="pdf-section-head"><h2>${esc(labels.kpis)}</h2></div><ul class="pdf-ul">
        <li>${esc(labels.kpiStudents)}: ${esc(formatCount(snap.kpis.students))}</li>
        <li>${esc(labels.kpiGroups)}: ${esc(formatCount(snap.kpis.groups))}</li>
        <li>${esc(labels.kpiAttendance)}: ${esc(formatPercent(snap.kpis.attendancePercent))}</li>
        <li>${esc(labels.kpiCompletion)}: ${esc(formatPercent(snap.kpis.completionPercent))}</li>
      </ul></section>`,
      sectionTitle: labels.kpis,
    });
  }

  if (snap?.students?.length) {
    const rows = snap.students
      .map(
        (s) =>
          `<tr><td>${esc(s.studentName)}</td><td>${esc(s.groupName)}</td><td>${esc(formatPercent(s.attendancePercent))}</td><td>${esc(s.trackStatus)}</td></tr>`,
      )
      .join('');
    blocks.push({
      key: key('students'),
      html: `<section><div class="pdf-section-head"><h2>${esc(labels.students)}</h2></div>
        <table class="pdf-table"><thead><tr><th>Name</th><th>Group</th><th>Att.</th><th>${esc(labels.trackStatus)}</th></tr></thead><tbody>${rows}</tbody></table></section>`,
      sectionTitle: labels.students,
    });
  }

  if (snap && !snap.assessment.available) {
    blocks.push({
      key: key('assessment'),
      html: `<section><div class="pdf-section-head"><h2>${esc(labels.assessment)}</h2></div><p class="pdf-p">${esc(snap.assessment.emptyReason || labels.noData)}</p></section>`,
      sectionTitle: labels.assessment,
    });
  }

  if (snap?.projects?.length) {
    const rows = snap.projects
      .map(
        (p) =>
          `<tr><td>${esc(p.name)}</td><td>${esc(p.status)}</td><td>${esc(formatPercent(p.completionPercent))}</td></tr>`,
      )
      .join('');
    blocks.push({
      key: key('projects'),
      html: `<section><div class="pdf-section-head"><h2>${esc(labels.projects)}</h2></div>
        <table class="pdf-table"><thead><tr><th>Name</th><th>Status</th><th>Done</th></tr></thead><tbody>${rows}</tbody></table></section>`,
      sectionTitle: labels.projects,
    });
  }

  const recs = report.recommendations.filter(
    (r) => r.text.trim().length > 0 && (!schoolFacing || !r.isInternal),
  );
  if (recs.length) {
    blocks.push({
      key: key('recs'),
      html: `<section><div class="pdf-section-head"><h2>${esc(labels.recommendations)}</h2></div>
        <ul class="pdf-ul">${recs.map((r) => `<li>${esc(r.text)}</li>`).join('')}</ul></section>`,
      sectionTitle: labels.recommendations,
    });
  }

  return blocks;
}

export async function buildReportPdfHtml(
  report: PartnershipReport,
  labels: ReportPdfLabels,
  options: ReportPdfOptions,
  params: { schoolFacing: boolean },
): Promise<string> {
  const css = buildCss();
  const blocks = buildReportBlocks(report, labels, params.schoolFacing);
  const packed = await packProgramPdfPages(
    blocks,
    labels as unknown as ProgramPdfLabels,
    css,
    options.dir,
  );
  const body = packed.length
    ? packed.map((p) => `<section class="pdf-page">${p.html}</section>`).join('')
    : `<section class="pdf-page"><p>${esc(labels.noData)}</p></section>`;

  return `<!DOCTYPE html>
<html lang="${options.dir === 'rtl' ? 'ar' : 'en'}" dir="${options.dir}">
<head>
  <meta charset="utf-8" />
  <title>${esc(report.reportNumber)} — ${esc(labels.documentTitle)}</title>
  <style>${css}</style>
</head>
<body><div class="pdf-doc">${body}</div></body>
</html>`;
}

export function openReportPdfWindow(html: string): Window | null {
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
