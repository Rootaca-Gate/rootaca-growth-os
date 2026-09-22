import PDFDocument from 'pdfkit';
import { StudentProgressReportDto } from './dto/report-response.dto';
import { splitFontRuns, toVisualLine } from './arabic-text';
import { ReportCopy, reportCopy } from './report-copy';
import { resolveReportFonts } from './report-fonts';

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 44;
const HEADER = 104;
const FOOTER = 40;
const PRIMARY = '#0C6B56';
const FOREST = '#0B4A3A';
const DEEP = '#06382D';
const MINT = '#2FDB9A';
const INK = '#141E1A';
const MUTED = '#7A8A83';
const CREAM = '#F4FBF8';
const SURFACE = '#E8F2EE';
const WHITE = '#FFFFFF';
const NO_FEATURES: PDFKit.Mixins.OpenTypeFeatures[] = [];
const TEXT_OPTS: PDFKit.Mixins.TextOptions = {
  lineBreak: false,
  continued: false,
  features: NO_FEATURES,
  characterSpacing: 0,
};

type Align = 'left' | 'right';

export async function renderStudentProgressPdf(report: StudentProgressReportDto): Promise<Buffer> {
  const copy = reportCopy(report.locale);
  const rtl = report.locale === 'ar';
  const fonts = resolveReportFonts();
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    bufferPages: true,
    // Avoid pdfkit's default Helvetica, which is often missing from Vercel file tracing.
    font: fonts.latinRegular,
    info: {
      Title: `${report.student.fullName} — ${copy.title}`,
      Author: 'ROOTACA Academy',
      Creator: 'ROOTACA Growth OS',
    },
  });

  doc.registerFont('NotoSans', fonts.latinRegular);
  doc.registerFont('NotoSans-Bold', fonts.latinBold);
  doc.registerFont('NotoSansArabic', fonts.arabicRegular);
  doc.registerFont('NotoSansArabic-Bold', fonts.arabicBold);
  doc.font('NotoSans');

  const pdf = collectPdf(doc);
  const painter = new ReportPainter(doc, copy, rtl);
  painter.paint(report);
  painter.finish();
  return pdf;
}

class ReportPainter {
  private y = HEADER + 22;
  private readonly contentWidth = PAGE.width - MARGIN * 2;
  private readonly align: Align;

  constructor(
    private readonly doc: PDFKit.PDFDocument,
    private readonly copy: ReportCopy,
    private readonly rtl: boolean,
  ) {
    this.align = rtl ? 'right' : 'left';
  }

  paint(report: StudentProgressReportDto): void {
    this.paintBackdrop();
    this.ensureSpace(28);
    this.line(report.student.fullName, 20, true, INK);
    this.y += 2;
    this.line(this.copy.generatedOn(report.generatedAt), 9, false, MUTED);
    this.y += 16;

    this.section(this.copy.sections.student, () => {
      this.fields(report.student.fields);
    });

    this.section(this.copy.sections.currentLevel, () => {
      if (!report.currentLevel) {
        this.empty(this.copy.emptySections.level);
        return;
      }
      this.line(report.currentLevel.name, 13, true, PRIMARY);
      this.y += 2;
      this.wrapped(report.currentLevel.description, 10, MUTED);
    });

    this.section(this.copy.sections.assessment, () => {
      if (!report.assessment) {
        this.empty(this.copy.emptySections.assessment);
        return;
      }
      this.scoreRow(this.copy.labels.overallScore, report.assessment.overallScore);
      this.y += 4;
      this.line(
        `${this.copy.labels.completedAt}: ${report.assessment.completedAt}`,
        9,
        false,
        MUTED,
      );
      this.y += 6;
      this.wrapped(report.assessment.summary, 10, INK);
      this.y += 8;
      for (const category of report.assessment.categories) {
        this.meter(category.name, category.score, category.detail);
      }
    });

    this.section(this.copy.sections.skills, () => {
      if (report.skills.length === 0) {
        this.empty(this.copy.emptySections.skills);
        return;
      }
      for (const skill of report.skills) {
        this.meter(skill.name, skill.score);
      }
    });

    this.section(this.copy.sections.recommendedPath, () => {
      if (!report.recommendedPath) {
        this.empty(this.copy.emptySections.path);
        return;
      }
      this.line(report.recommendedPath.name, 13, true, PRIMARY);
      this.y += 2;
      this.wrapped(report.recommendedPath.description, 10, MUTED);
      if (report.recommendedPath.reasons.length > 0) {
        this.y += 6;
        this.line(this.copy.labels.reasons, 9, true, INK);
        this.y += 2;
        this.bullets(report.recommendedPath.reasons);
      }
      if (report.recommendedPath.alternativeName) {
        this.y += 6;
        this.line(
          `${this.copy.labels.alternative}: ${report.recommendedPath.alternativeName}`,
          10,
          false,
          MUTED,
        );
      }
    });

    this.section(this.copy.sections.roadmap, () => {
      if (!report.roadmap) {
        this.empty(this.copy.emptySections.roadmap);
        return;
      }
      this.line(`${report.roadmap.pathName} · ${report.roadmap.levelName}`, 11, true, INK);
      this.y += 4;
      this.scoreRow(this.copy.labels.overall, report.roadmap.overallPercent);
      this.y += 4;
      this.line(
        `${this.copy.labels.completed} ${report.roadmap.completedCount}/${report.roadmap.itemCount} · ${this.copy.labels.inProgress} ${report.roadmap.inProgressCount} · ${this.copy.labels.blocked} ${report.roadmap.blockedCount}`,
        9,
        false,
        MUTED,
      );
      this.y += 8;
      for (const phase of report.roadmap.phases) {
        this.meter(phase.title, phase.percent, `${phase.completedCount}/${phase.itemCount}`);
      }
    });

    this.section(this.copy.sections.kpis, () => {
      this.scoreRow(this.copy.labels.overall, report.kpis.overallPercent);
      this.y += 2;
      this.line(report.kpis.overallStatusLabel, 9, false, MUTED);
      this.y += 8;
      if (report.kpis.items.length === 0) {
        this.empty(this.copy.emptySections.kpis);
        return;
      }
      for (const item of report.kpis.items) {
        this.meter(
          item.name,
          item.progressPercent,
          `${item.actual}/${item.target} ${item.unit} · ${item.statusLabel}`,
        );
      }
    });

    this.section(this.copy.sections.projects, () => {
      this.scoreRow(this.copy.labels.overall, report.projects.overallPercent);
      this.y += 4;
      this.line(
        `${this.copy.labels.assigned} ${report.projects.assignedCount} · ${this.copy.labels.completed} ${report.projects.completedCount}`,
        9,
        false,
        MUTED,
      );
      this.y += 8;
      if (report.projects.items.length === 0) {
        this.empty(this.copy.emptySections.projects);
        return;
      }
      for (const item of report.projects.items) {
        this.meter(item.name, item.progressPercent, item.statusLabel);
      }
    });

    this.listSection(
      this.copy.sections.achievements,
      report.achievements,
      this.copy.emptySections.achievements,
    );
    this.listSection(
      this.copy.sections.areasForImprovement,
      report.areasForImprovement,
      this.copy.emptySections.areasForImprovement,
    );
    this.listSection(
      this.copy.sections.nextGoals,
      report.nextGoals,
      this.copy.emptySections.nextGoals,
    );
  }

  finish(): void {
    const range = this.doc.bufferedPageRange();
    for (let index = 0; index < range.count; index += 1) {
      this.doc.switchToPage(range.start + index);
      this.drawHeader();
      this.drawFooter(index + 1, range.count);
    }
    this.doc.end();
  }

  private listSection(title: string, items: string[], empty: string): void {
    this.section(title, () => {
      if (items.length === 0) {
        this.empty(empty);
        return;
      }
      this.bullets(items);
    });
  }

  private section(title: string, body: () => void): void {
    this.ensureSpace(56);
    this.doc.save();
    const barX = this.rtl ? PAGE.width - MARGIN - 4 : MARGIN;
    this.doc.roundedRect(barX, this.y, 4, 17, 2).fill(MINT);
    this.doc.restore();
    this.line(title, 12, true, FOREST, 10);
    this.y += 8;
    const start = this.y;
    body();
    if (this.y === start) {
      this.y += 4;
    }
    this.y += 18;
  }

  private fields(fields: { label: string; value: string }[]): void {
    const gap = 14;
    const colWidth = (this.contentWidth - gap) / 2;
    let column = 0;
    let rowY = this.y;
    let rowHeight = 0;

    for (const item of fields) {
      const wide = item.value.length > 42;
      if (wide && column === 1) {
        this.y = rowY + rowHeight + 8;
        column = 0;
        rowY = this.y;
        rowHeight = 0;
      }
      const x = this.columnX(column, colWidth, gap, wide);
      const width = wide ? this.contentWidth : colWidth;
      const used = this.fieldBlock(item.label, item.value, x, rowY, width);
      rowHeight = Math.max(rowHeight, used);
      if (wide) {
        this.y = rowY + rowHeight + 8;
        column = 0;
        rowY = this.y;
        rowHeight = 0;
        continue;
      }
      column += 1;
      if (column > 1) {
        this.y = rowY + rowHeight + 8;
        column = 0;
        rowY = this.y;
        rowHeight = 0;
      }
    }
    if (column !== 0) {
      this.y = rowY + rowHeight;
    } else if (rowHeight > 0) {
      this.y = rowY;
    }
  }

  private fieldBlock(label: string, value: string, x: number, y: number, width: number): number {
    this.drawText(label, x, y, width, 8, false, MUTED);
    const lines = this.wrap(value, width, 10, true);
    let cursor = y + 13;
    for (const line of lines.slice(0, 3)) {
      this.drawText(line, x, cursor, width, 10, true, INK);
      cursor += this.lineGap(10);
    }
    return cursor - y;
  }

  private meter(label: string, score: number, extra?: string): void {
    this.ensureSpace(30);
    const barWidth = this.contentWidth;
    const caption = extra ? `${label} · ${extra}` : label;
    this.drawText(caption, MARGIN, this.y, barWidth - 40, 9, false, INK);
    this.drawText(`${Math.round(score)}`, MARGIN, this.y, barWidth, 9, true, PRIMARY, false, 'end');
    this.y += 15;
    const x = MARGIN;
    const filled = Math.max(0, Math.min(100, score)) / 100;
    const fillWidth = filled > 0 ? Math.max(6, barWidth * filled) : 0;
    this.doc.save();
    this.doc.roundedRect(x, this.y, barWidth, 8, 4).fill(SURFACE);
    if (fillWidth > 0) {
      const fillX = this.rtl ? x + barWidth - fillWidth : x;
      this.doc.roundedRect(fillX, this.y, fillWidth, 8, 4).fill(PRIMARY);
    }
    this.doc.restore();
    this.y += 16;
  }

  private scoreRow(label: string, score: number): void {
    this.line(`${label}: ${Math.round(score)}/100`, 12, true, PRIMARY);
  }

  private bullets(items: string[]): void {
    const indent = 16;
    for (const item of items) {
      this.ensureSpace(20);
      const bulletX = this.rtl ? PAGE.width - MARGIN - 3 : MARGIN + 3;
      this.doc.save();
      this.doc.circle(bulletX, this.y + 6, 2.3).fill(MINT);
      this.doc.restore();
      const x = this.rtl ? MARGIN : MARGIN + indent;
      const width = this.contentWidth - indent;
      const lines = this.wrap(item, width, 10, false);
      for (const line of lines) {
        this.ensureSpace(16);
        this.drawText(line, x, this.y, width, 10, false, INK);
        this.y += this.lineGap(10);
      }
      this.y += 3;
    }
  }

  private empty(message: string): void {
    this.wrapped(message, 10, MUTED);
  }

  private wrapped(text: string, size: number, color: string): void {
    const lines = this.wrap(text, this.contentWidth, size, false);
    for (const line of lines) {
      this.ensureSpace(size + 8);
      this.line(line, size, false, color);
    }
  }

  private line(text: string, size: number, bold: boolean, color: string, indent = 0): void {
    const x = this.rtl ? MARGIN : MARGIN + indent;
    this.drawText(text, x, this.y, this.contentWidth - indent, size, bold, color);
    this.y += this.lineGap(size);
  }

  private drawHeader(): void {
    this.doc.save();
    const grad = this.doc.linearGradient(0, 0, PAGE.width, HEADER);
    grad.stop(0, DEEP);
    grad.stop(0.48, FOREST);
    grad.stop(1, '#0E5C48');
    this.doc.rect(0, 0, PAGE.width, HEADER).fill(grad);
    this.doc.rect(0, HEADER - 3, PAGE.width, 3).fill(MINT);

    const mark = 56;
    const gap = 14;
    const logoX = this.rtl ? PAGE.width - MARGIN - mark : MARGIN;
    const textX = this.rtl ? MARGIN : MARGIN + mark + gap;
    const textWidth = PAGE.width - MARGIN * 2 - mark - gap;
    drawRootacaMark(this.doc, logoX, 24, mark);
    this.drawBrandWord(textX, 30, textWidth, 'ROOTACA', 17, 2.4, WHITE);
    this.drawBrandWord(textX, 52, textWidth, 'ACADEMY', 8, 2.8, MINT);
    this.drawText(this.copy.title, textX, 70, textWidth, 10, false, CREAM);
    this.doc.restore();
  }

  private drawFooter(page: number, total: number): void {
    const y = PAGE.height - FOOTER + 12;
    this.doc.save();
    this.doc
      .moveTo(MARGIN, PAGE.height - FOOTER)
      .lineTo(PAGE.width - MARGIN, PAGE.height - FOOTER)
      .strokeColor(MINT)
      .lineWidth(1.4)
      .stroke();
    this.doc.restore();
    this.drawText(this.copy.confidential, MARGIN, y, this.contentWidth, 8, false, MUTED);
    this.drawText(
      this.copy.page(page, total),
      MARGIN,
      y,
      this.contentWidth,
      8,
      false,
      MUTED,
      false,
      'end',
    );
  }

  private paintBackdrop(): void {
    this.doc.save();
    this.doc.rect(0, HEADER - 3, PAGE.width, PAGE.height - HEADER + 3).fill(CREAM);
    this.doc.restore();
  }

  private ensureSpace(needed: number): void {
    if (this.y + needed <= PAGE.height - FOOTER - 12) {
      return;
    }
    this.doc.addPage();
    this.paintBackdrop();
    this.y = HEADER + 22;
  }

  private wrap(text: string, width: number, size: number, bold: boolean): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return [this.copy.empty];
    }
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const trial = current ? `${current} ${word}` : word;
      if (this.measure(trial, size, bold) <= width || current.length === 0) {
        current = trial;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) {
      lines.push(current);
    }
    return lines;
  }

  private measure(text: string, size: number, bold: boolean): number {
    const visual = toVisualLine(text, this.rtl);
    let width = 0;
    for (const run of splitFontRuns(visual)) {
      this.doc.font(this.fontName(run.arabic, bold)).fontSize(size);
      width += this.doc.widthOfString(run.text, { features: NO_FEATURES });
    }
    return width;
  }

  private drawText(
    text: string,
    x: number,
    y: number,
    width: number,
    size: number,
    bold: boolean,
    color: string,
    brandLatin = false,
    align: Align | 'end' = this.align,
  ): void {
    const visual = brandLatin ? text : toVisualLine(text, this.rtl);
    const runs = brandLatin ? [{ text: visual, arabic: false }] : splitFontRuns(visual);
    const total = runs.reduce((sum, run) => {
      this.doc.font(this.fontName(run.arabic && !brandLatin, bold)).fontSize(size);
      return sum + this.doc.widthOfString(run.text, { features: NO_FEATURES });
    }, 0);
    const resolved: Align = align === 'end' ? (this.rtl ? 'left' : 'right') : align;
    let cursor = resolved === 'right' ? x + Math.max(0, width - total) : x;
    for (const run of runs) {
      this.doc
        .font(this.fontName(run.arabic && !brandLatin, bold))
        .fontSize(size)
        .fillColor(color)
        .text(run.text, cursor, y, TEXT_OPTS);
      cursor += this.doc.widthOfString(run.text, { features: NO_FEATURES });
    }
  }

  private drawBrandWord(
    x: number,
    y: number,
    width: number,
    text: string,
    size: number,
    spacing: number,
    color: string,
  ): void {
    this.doc.font('NotoSans-Bold').fontSize(size).fillColor(color);
    const options = { ...TEXT_OPTS, characterSpacing: spacing };
    const total = this.doc.widthOfString(text, options);
    const start = this.rtl ? x + Math.max(0, width - total) : x;
    this.doc.text(text, start, y, options);
  }

  private fontName(arabic: boolean, bold: boolean): string {
    if (arabic) {
      return bold ? 'NotoSansArabic-Bold' : 'NotoSansArabic';
    }
    return bold ? 'NotoSans-Bold' : 'NotoSans';
  }

  private lineGap(size: number): number {
    return this.rtl ? size + 7 : size + 4;
  }

  private columnX(column: number, colWidth: number, gap: number, wide: boolean): number {
    if (wide) {
      return MARGIN;
    }
    if (this.rtl) {
      return column === 0 ? MARGIN + colWidth + gap : MARGIN;
    }
    return column === 0 ? MARGIN : MARGIN + colWidth + gap;
  }
}

function drawRootacaMark(doc: PDFKit.PDFDocument, x: number, y: number, size: number): void {
  const s = size / 64;
  const grad = doc.linearGradient(x + 8 * s, y + 4 * s, x + 58 * s, y + 60 * s);
  grad.stop(0, DEEP);
  grad.stop(0.48, FOREST);
  grad.stop(1, '#0E5C48');
  doc.save();
  doc.roundedRect(x, y, size, size, 14 * s).fill(grad);
  doc
    .lineWidth(4.6 * s)
    .strokeColor(CREAM)
    .lineCap('round')
    .lineJoin('round')
    .roundedRect(x + 16 * s, y + 17 * s, 32 * s, 26 * s, 11 * s)
    .stroke();
  doc.circle(x + 32 * s, y + 30 * s, 2.7 * s).fill(CREAM);
  doc
    .lineWidth(5 * s)
    .moveTo(x + 37.5 * s, y + 41.5 * s)
    .lineTo(x + 48.2 * s, y + 52.8 * s)
    .stroke();
  doc
    .strokeColor(MINT)
    .lineWidth(4.4 * s)
    .moveTo(x + 16.6 * s, y + 44.8 * s)
    .lineTo(x + 24.4 * s, y + 37.2 * s)
    .stroke();
  doc.circle(x + 18.6 * s, y + 17.6 * s, 3.7 * s).fill(MINT);
  doc.circle(x + 45.4 * s, y + 17.6 * s, 3.7 * s).fill(MINT);
  doc.restore();
}

function collectPdf(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}
