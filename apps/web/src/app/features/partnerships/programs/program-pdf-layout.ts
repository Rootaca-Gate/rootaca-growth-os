import { PartnershipProgram } from '../partnership.models';
import { skillTags } from './program-display';
import type { ProgramPdfLabels } from './program-pdf';

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pdfHasContent(value: string | null | undefined): boolean {
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

export type PdfBlock = {
  /** Unique key for measurement */
  key: string;
  html: string;
  /** Section title used when continuing onto next page */
  sectionTitle?: string;
  /** Prefer starting a new page before this block */
  pageBreakBefore?: boolean;
  /** Do not orphan this block alone at the end of a page if avoidable */
  keepWithNext?: boolean;
};

function sectionHead(title: string, continued = false, continuedLabel = 'continued'): string {
  const label = continued ? `${title} (${continuedLabel})` : title;
  return `
    <div class="pdf-section-head">
      <span class="pdf-accent-bar" aria-hidden="true"></span>
      <h2>${esc(label)}</h2>
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

/** Build atomic content blocks for height-aware page packing. */
export function buildProgramPdfBlocks(
  program: PartnershipProgram,
  labels: ProgramPdfLabels,
  options: { typeLabel: string; levelLabel: string; deliveryLabels: string[] },
): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  let seq = 0;
  const nextKey = (prefix: string) => `${prefix}-${seq++}`;

  const pushSection = (title: string, keepWithNext = true) => {
    blocks.push({
      key: nextKey('head'),
      html: `<section class="pdf-section-start">${sectionHead(title)}</section>`,
      sectionTitle: title,
      keepWithNext,
    });
  };

  // Overview
  {
    const desc = text(program.shortDescription);
    const school = text(program.schoolValue);
    const student = text(program.studentValue);
    if (desc || school || student) {
      pushSection(labels.overview);
      if (desc) {
        blocks.push({
          key: nextKey('overview-lead'),
          html: `<p class="pdf-lead">${desc}</p>`,
          sectionTitle: labels.overview,
        });
      }
      const cards = [
        school
          ? `<article class="pdf-value-card"><h3>${esc(labels.schoolValue)}</h3><p>${school}</p></article>`
          : '',
        student
          ? `<article class="pdf-value-card"><h3>${esc(labels.studentValue)}</h3><p>${student}</p></article>`
          : '',
      ].filter(Boolean);
      if (cards.length) {
        blocks.push({
          key: nextKey('overview-cards'),
          html: `<div class="pdf-value-grid">${cards.join('')}</div>`,
          sectionTitle: labels.overview,
        });
      }
    }
  }

  // Audience
  {
    const age = text(program.targetAge);
    const grades = text(program.targetGrades);
    const level =
      options.levelLabel && options.levelLabel !== '—' && pdfHasContent(options.levelLabel)
        ? esc(options.levelLabel)
        : '';
    const profile = text(program.recommendedStudentProfile);
    const facts = [
      age
        ? `<div class="pdf-fact"><span class="pdf-fact-label">${esc(labels.targetAge)}</span><strong class="pdf-fact-value">${age}</strong></div>`
        : '',
      grades
        ? `<div class="pdf-fact"><span class="pdf-fact-label">${esc(labels.targetGrades)}</span><strong class="pdf-fact-value">${grades}</strong></div>`
        : '',
      level
        ? `<div class="pdf-fact"><span class="pdf-fact-label">${esc(labels.level)}</span><strong class="pdf-fact-value">${level}</strong></div>`
        : '',
    ].filter(Boolean);

    if (facts.length || profile) {
      pushSection(labels.audience);
      if (facts.length) {
        const cols = facts.length >= 3 ? '' : ' pdf-facts--2';
        blocks.push({
          key: nextKey('audience-facts'),
          html: `<div class="pdf-facts${cols}">${facts.join('')}</div>`,
          sectionTitle: labels.audience,
        });
      }
      if (profile) {
        blocks.push({
          key: nextKey('audience-profile'),
          html: `<div class="pdf-profile"><span class="pdf-fact-label">${esc(labels.profile)}</span><p>${profile}</p></div>`,
          sectionTitle: labels.audience,
        });
      }
    }
  }

  // Objectives — one item per block
  if (program.objectives.length) {
    pushSection(labels.objectives);
    program.objectives.forEach((item, i) => {
      blocks.push({
        key: nextKey('obj'),
        html: numberedItem(i + 1, item.title, item.description),
        sectionTitle: labels.objectives,
      });
    });
  }

  // Curriculum — one module per block
  if (program.curriculumModules.length) {
    pushSection(labels.curriculum);
    program.curriculumModules.forEach((item, i) => {
      blocks.push({
        key: nextKey('cur'),
        html: numberedItem(i + 1, item.title, item.description, tagsHtml(item.skillsDeveloped)),
        sectionTitle: labels.curriculum,
      });
    });
  }

  // Activities — pairs of cards
  if (program.activities.length) {
    pushSection(labels.activities);
    for (let i = 0; i < program.activities.length; i += 2) {
      const pair = program.activities.slice(i, i + 2);
      blocks.push({
        key: nextKey('act'),
        html: `<div class="pdf-card-grid">${pair
          .map((item) => activityCard(item.name, item.description, item.skillsDeveloped))
          .join('')}</div>`,
        sectionTitle: labels.activities,
      });
    }
  }

  // Projects
  {
    const samples = program.sampleProjects;
    const hasFinal =
      pdfHasContent(program.finalProjectName) ||
      pdfHasContent(program.finalProjectDescription) ||
      pdfHasContent(program.finalProjectExpectedOutput) ||
      pdfHasContent(program.finalProjectEvaluationMethod);

    if (samples.length || hasFinal) {
      pushSection(labels.projects);
      if (samples.length) {
        blocks.push({
          key: nextKey('sample-head'),
          html: `<h3 class="pdf-subhead">${esc(labels.sampleProjects)}</h3>`,
          sectionTitle: labels.projects,
          keepWithNext: true,
        });
        for (let i = 0; i < samples.length; i += 2) {
          const pair = samples.slice(i, i + 2);
          blocks.push({
            key: nextKey('sample'),
            html: `<div class="pdf-card-grid">${pair
              .map((item) => {
                const extra = item.expectedOutput
                  ? `<p><strong>${esc(labels.expectedOutput)}:</strong> ${esc(item.expectedOutput)}</p>`
                  : '';
                return `<article class="pdf-mini-card"><h3>${esc(item.name)}</h3>${
                  item.description && pdfHasContent(item.description)
                    ? `<p>${esc(item.description.trim())}</p>`
                    : ''
                }${extra}${tagsHtml(item.skills)}</article>`;
              })
              .join('')}</div>`,
            sectionTitle: labels.projects,
          });
        }
      }
      if (hasFinal) {
        blocks.push({
          key: nextKey('final'),
          pageBreakBefore: samples.length > 2,
          html: `
            <div class="pdf-final">
              <p class="pdf-final-kicker">${esc(labels.finalProject)}</p>
              <h3>${text(program.finalProjectName) || esc(labels.finalProject)}</h3>
              ${
                pdfHasContent(program.finalProjectDescription)
                  ? `<p>${esc(program.finalProjectDescription!.trim())}</p>`
                  : ''
              }
              ${
                pdfHasContent(program.finalProjectExpectedOutput)
                  ? `<div class="pdf-final-meta"><strong>${esc(labels.expectedOutput)}</strong><p>${esc(program.finalProjectExpectedOutput!.trim())}</p></div>`
                  : ''
              }
              ${
                pdfHasContent(program.finalProjectEvaluationMethod)
                  ? `<div class="pdf-final-meta"><strong>${esc(labels.evaluation)}</strong><p>${esc(program.finalProjectEvaluationMethod!.trim())}</p></div>`
                  : ''
              }
              ${tagsHtml(program.finalProjectSkills)}
            </div>`,
          sectionTitle: labels.projects,
        });
      }
    }
  }

  // Assessment
  {
    const methods = program.assessmentMethods.filter((item) => item.enabled);
    if (methods.length) {
      pushSection(labels.assessment);
      methods.forEach((item, i) => {
        blocks.push({
          key: nextKey('assess'),
          html: `<div class="pdf-timeline">${numberedItem(i + 1, item.label, item.description)}</div>`,
          sectionTitle: labels.assessment,
        });
      });
    }
  }

  // Delivery
  if (options.deliveryLabels.length) {
    pushSection(labels.delivery);
    blocks.push({
      key: nextKey('delivery'),
      html: `<div class="pdf-delivery">${options.deliveryLabels
        .map((label) => `<span class="pdf-tag">${esc(label)}</span>`)
        .join('')}</div>`,
      sectionTitle: labels.delivery,
    });
  }

  // Requirements
  {
    const equipment = program.requirements.filter((r) => r.kind === 'EQUIPMENT');
    const schoolReqs = program.requirements.filter((r) => r.kind === 'SCHOOL');
    if (equipment.length || schoolReqs.length) {
      pushSection(labels.requirements);
      if (equipment.length) {
        blocks.push({
          key: nextKey('eq-head'),
          html: `<h3 class="pdf-subhead">${esc(labels.equipment)}</h3>`,
          sectionTitle: labels.requirements,
          keepWithNext: true,
        });
        equipment.forEach((item) => {
          blocks.push({
            key: nextKey('eq'),
            html: `<ul class="pdf-check-list">${checklistItem(
              item.label,
              item.priority === 'RECOMMENDED' ? labels.recommended : labels.required,
              item.description,
            )}</ul>`,
            sectionTitle: labels.requirements,
          });
        });
      }
      if (schoolReqs.length) {
        blocks.push({
          key: nextKey('sch-head'),
          html: `<h3 class="pdf-subhead">${esc(labels.schoolReqs)}</h3>`,
          sectionTitle: labels.requirements,
          keepWithNext: true,
        });
        schoolReqs.forEach((item) => {
          blocks.push({
            key: nextKey('sch'),
            html: `<ul class="pdf-check-list">${checklistItem(
              item.label,
              item.priority === 'RECOMMENDED' ? labels.recommended : labels.required,
              item.description,
            )}</ul>`,
            sectionTitle: labels.requirements,
          });
        });
      }
    }
  }

  // Outcomes
  if (program.outcomes.length) {
    pushSection(labels.outcomes);
    program.outcomes.forEach((item, i) => {
      blocks.push({
        key: nextKey('out'),
        html: numberedItem(i + 1, item.title, item.description),
        sectionTitle: labels.outcomes,
      });
    });
  }

  // CTA always last, prefer own page if outcomes exist
  blocks.push({
    key: nextKey('cta'),
    pageBreakBefore: program.outcomes.length > 0,
    html: `
      <section class="pdf-section">
        <div class="pdf-cta">
          <h2>${esc(labels.ctaTitle)}</h2>
          <p class="pdf-cta-brand">${esc(labels.brand)}</p>
          <p class="pdf-cta-init">${esc(labels.initiative)}</p>
          <p class="pdf-cta-explore">${esc(labels.ctaExplore)}</p>
        </div>
        <div class="pdf-meta-block">
          ${esc(labels.documentTitle)} · ${esc(program.name)} · ${esc(labels.organization)} · ${esc(labels.initiative)}
        </div>
      </section>`,
  });

  return blocks;
}

const CONTENT_WIDTH_PX = 698; // 794 - 48*2
/** Usable main area height inside an A4 content page. */
export const PDF_CONTENT_CAPACITY_PX = 900;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function measureBlockHeights(
  blocks: PdfBlock[],
  css: string,
  dir: 'rtl' | 'ltr',
): Promise<number[]> {
  if (!blocks.length) {
    return [];
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;left:-16000px;top:0;width:900px;height:1400px;border:0;opacity:0;pointer-events:none;direction:ltr;';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    if (!doc) {
      return blocks.map(() => 80);
    }

    const measureHtml = blocks
      .map(
        (block, index) =>
          `<div class="pdf-measure-item" data-i="${index}" style="width:${CONTENT_WIDTH_PX}px">${block.html}</div>`,
      )
      .join('');

    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="${dir === 'rtl' ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    ${css}
    html, body { background:#fff; margin:0; padding:0; }
    .pdf-measure-root { padding:0; }
    .pdf-measure-item { margin:0; padding:0; }
  </style>
</head>
<body>
  <div class="pdf-measure-root" dir="${dir}">${measureHtml}</div>
</body>
</html>`);
    doc.close();

    await wait(280);
    const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) {
      try {
        await fonts.ready;
      } catch {
        /* ignore */
      }
    }
    await wait(80);

    return blocks.map((_, index) => {
      const el = doc.querySelector(`[data-i="${index}"]`) as HTMLElement | null;
      const height = el ? Math.ceil(el.getBoundingClientRect().height) : 80;
      return Math.max(24, height);
    });
  } finally {
    iframe.remove();
  }
}

type PackedPage = { html: string };

/**
 * Pack measured blocks into A4 content pages with continuation headers.
 */
export async function packProgramPdfPages(
  blocks: PdfBlock[],
  labels: ProgramPdfLabels,
  css: string,
  dir: 'rtl' | 'ltr',
  capacityPx = PDF_CONTENT_CAPACITY_PX,
): Promise<PackedPage[]> {
  if (!blocks.length) {
    return [];
  }

  const heights = await measureBlockHeights(blocks, css, dir);
  const pages: PdfBlock[][] = [];
  let current: PdfBlock[] = [];
  let used = 0;
  /** Section title of the last non-header block placed on the previous flushed page */
  let openSection: string | undefined;

  const flush = () => {
    if (!current.length) {
      return;
    }
    const lastWithSection = [...current].reverse().find((b) => b.sectionTitle);
    openSection = lastWithSection?.sectionTitle;
    pages.push(current);
    current = [];
    used = 0;
  };

  const continuationHeader = (title: string, key: string): PdfBlock => ({
    key: `cont-${key}`,
    html: `<section class="pdf-section-start">${sectionHead(title, true, labels.continued)}</section>`,
    sectionTitle: title,
  });

  const isSectionHeader = (block: PdfBlock) => block.html.includes('pdf-section-head');

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const height = heights[i] ?? 80;
    const next = blocks[i + 1];
    const nextHeight = next ? (heights[i + 1] ?? 0) : 0;

    if (block.pageBreakBefore && current.length) {
      flush();
    }

    // Keep section header with at least one following item when possible
    if (
      block.keepWithNext &&
      next &&
      current.length > 0 &&
      used + height + nextHeight > capacityPx
    ) {
      flush();
    }

    let placeHeight = height;
    const needsCont =
      current.length === 0 &&
      Boolean(block.sectionTitle) &&
      openSection === block.sectionTitle &&
      !isSectionHeader(block);

    if (needsCont && block.sectionTitle) {
      placeHeight += 44;
    }

    if (current.length > 0 && used + placeHeight > capacityPx) {
      flush();
    }

    // After flush, may still need continuation
    if (
      current.length === 0 &&
      block.sectionTitle &&
      openSection === block.sectionTitle &&
      !isSectionHeader(block)
    ) {
      current.push(continuationHeader(block.sectionTitle, block.key));
      used += 44;
    }

    // Oversized single block: place alone
    if (current.length === 0 && height > capacityPx) {
      current.push(block);
      used = height;
      flush();
      continue;
    }

    if (current.length > 0 && used + height > capacityPx) {
      flush();
      if (block.sectionTitle && !isSectionHeader(block) && openSection === block.sectionTitle) {
        current.push(continuationHeader(block.sectionTitle, block.key));
        used += 44;
      }
    }

    current.push(block);
    used += height;

    if (isSectionHeader(block) && block.sectionTitle) {
      openSection = block.sectionTitle;
    }
  }

  flush();

  return pages.map((pageBlocks) => ({
    html: `<div class="pdf-page-body">${pageBlocks.map((b) => b.html).join('\n')}</div>`,
  }));
}

