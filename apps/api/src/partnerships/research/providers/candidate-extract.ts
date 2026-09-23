import { PartnershipResearchSourceType } from '@prisma/client';
import { normalizeWebsiteDomain } from '../../common/partnership.normalize';
import type { DiscoveryResult } from './discovery.provider';
import {
  classifyCandidateQuality,
  isInvalidNonInstitutionName,
  normalizeInstitutionDisplayName,
  normalizeInstitutionKey,
  sameSourceIdentityKeys,
} from './candidate-quality';
import {
  cleanInstitutionTitle,
  isDirectoryListingDetailUrl,
  isDiscoverySourceUrl,
  isGenericListTitle,
  isLikelyListicleOrAggregator,
} from './web-search/web-search.mapper';

export type ExtractedCandidateDraft = {
  discoveredName: string;
  website?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  googleMapsUrl?: string;
  sourceType: PartnershipResearchSourceType;
  sourceName: string;
  sourceUrl: string;
  snippet?: string;
  domain?: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  likelyOfficialWebsite: boolean;
  skipAsInstitution: boolean;
  notes: string;
  signals: {
    hasCoding: boolean;
    hasRobotics: boolean;
    hasStem: boolean;
    hasAi: boolean;
    hasTechClub: boolean;
    hasAfterSchool: boolean;
    hasSummerCamp: boolean;
    hasMakerspace: boolean;
  };
  evidence: Array<{
    field: string;
    value: string;
    sourceUrl: string;
    sourceType: PartnershipResearchSourceType;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
};

export type DiscoverySourceKind =
  | 'INSTITUTION_PAGE'
  | 'DIRECTORY_LISTING'
  | 'DISCOVERY_SOURCE'
  | 'WEAK';

const TECH_PATTERNS: Array<{ key: keyof ExtractedCandidateDraft['signals']; re: RegExp }> = [
  { key: 'hasCoding', re: /\b(coding|programming|code\s*club|برمجة)\b/i },
  { key: 'hasRobotics', re: /\b(robotics?|روبوت|روبوتكس)\b/i },
  { key: 'hasStem', re: /\b(stem|s\.t\.e\.m)\b/i },
  { key: 'hasAi', re: /\b(artificial\s*intelligence|\bai\b|ذكاء\s*اصطناعي)\b/i },
  { key: 'hasTechClub', re: /\b(tech\s*club|technology\s*club|نادي\s*تكنولوجيا)\b/i },
  { key: 'hasAfterSchool', re: /\b(after[\s-]?school|بعد\s*المدرسة)\b/i },
  { key: 'hasSummerCamp', re: /\b(summer\s*(camp|program)|مخيم\s*صيفي)\b/i },
  { key: 'hasMakerspace', re: /\b(makerspace|maker\s*space|fab\s*lab)\b/i },
];

const INSTITUTION_NAME_HINT =
  /\b(school|schools|academy|international|british|american|canadian|german|french|italian|ib|stem|college)\b|مدرسة|مدارس|أكاديمية|اكاديمية|دولية|لغات/i;

const CONTACT_LABELS = {
  phone: /^(?:[-*•]\s*)?(?:الهاتف|التليفون|التلفون|الموبايل|الجوال|الخط\s*الساخن|phone|tel|telephone|mobile|hotline)\s*[:：]\s*(.+)$/i,
  email: /^(?:[-*•]\s*)?(?:الإيميل|الايميل|البريد(?:\s*الإلكتروني)?|email|e-mail)\s*[:：]\s*(.+)$/i,
  website: /^(?:[-*•]\s*)?(?:الموقع\s*الإلكتروني|الموقع\s*الالكتروني|الموقع|website|web\s*site|site|url)\s*[:：]\s*(.+)$/i,
  address: /^(?:[-*•]\s*)?(?:العنوان|عنوان\s*المدرسة|عنوان\s*المؤسسة|address)\s*[:：]\s*(.+)$/i,
  whatsapp: /^(?:[-*•]\s*)?(?:واتساب|واتس\s*اب|whatsapp)\s*[:：]\s*(.+)$/i,
};

/**
 * Classify whether a search hit is an institution page or a discovery source (article/list).
 */
export function classifyDiscoverySource(result: DiscoveryResult): DiscoverySourceKind {
  const title = result.title ?? '';
  const domain = result.domain;
  const url = result.url ?? '';

  // KidsDirectory /ad/{slug}/ pages are single-school profiles with contacts
  if (isDirectoryListingDetailUrl(url)) {
    return 'DIRECTORY_LISTING';
  }

  if (isGenericListTitle(title) || isDiscoverySourceUrl(url)) {
    return 'DISCOVERY_SOURCE';
  }

  // Aggregator domains without a detail URL → multi-school discovery
  if (isLikelyListicleOrAggregator(title, domain)) {
    return 'DISCOVERY_SOURCE';
  }

  if (
    result.sourceType === PartnershipResearchSourceType.PUBLIC_DIRECTORY ||
    result.sourceType === PartnershipResearchSourceType.SEARCH_ENGINE
  ) {
    if (isDiscoverySourceUrl(url) || isGenericListTitle(title)) {
      return 'DISCOVERY_SOURCE';
    }
  }

  if (
    result.sourceType === PartnershipResearchSourceType.OFFICIAL_WEBSITE &&
    !isGenericListTitle(title)
  ) {
    return 'INSTITUTION_PAGE';
  }

  if (INSTITUTION_NAME_HINT.test(title) && !isGenericListTitle(title)) {
    return 'INSTITUTION_PAGE';
  }

  return 'WEAK';
}

/**
 * Extract zero or more institution candidates from a search result (+ optional fetched page text).
 * Article titles are NEVER institutions by themselves.
 */
export function extractCandidatesFromDiscovery(
  result: DiscoveryResult,
  pageText?: string | null,
): ExtractedCandidateDraft[] {
  const kind = classifyDiscoverySource(result);
  const sourceType = mapSourceType(result, kind);
  const combinedText = [pageText, result.snippet, result.title].filter(Boolean).join('\n\n');

  if (kind === 'DIRECTORY_LISTING') {
    const profile = extractDirectoryListingProfile(combinedText, result, sourceType);
    return profile ? [profile] : [];
  }

  if (kind === 'DISCOVERY_SOURCE') {
    const fromArticle = extractInstitutionsFromArticleContent(combinedText, result.url, sourceType);
    if (fromArticle.length > 0) {
      return fromArticle.map((item) =>
        finalizeDraft(
          item,
          result,
          sourceType,
          /* likelyOfficial */ false,
          'Extracted from discovery source article/directory.',
        ),
      );
    }
    // Generic list/article with no extractable institutions → zero candidates
    return [];
  }

  if (kind === 'INSTITUTION_PAGE') {
    if (isGenericListTitle(result.title)) {
      return [];
    }
    const name = normalizeInstitutionDisplayName(cleanInstitutionTitle(result.title));
    if (!name || isGenericListTitle(name) || isInvalidNonInstitutionName(name)) {
      return [];
    }
    if (!INSTITUTION_NAME_HINT.test(name) && !looksLikeInstitutionDomain(result.domain)) {
      return [];
    }
    const website = result.url;
    const quality = classifyCandidateQuality({
      name,
      body: result.snippet ?? '',
      website,
    });
    if (quality !== 'VALID_INSTITUTION') {
      return [];
    }
    const signals = detectSignals(`${result.title} ${result.snippet ?? ''} ${result.query}`);
    const evidence = baseEvidence(name, result, sourceType, signals);
    evidence.push({
      field: 'website',
      value: website,
      sourceUrl: result.url,
      sourceType: PartnershipResearchSourceType.OFFICIAL_WEBSITE,
      confidence: 'MEDIUM',
    });
    return [
      finalizeDraft(
        {
          discoveredName: name,
          website,
          signals,
          evidence,
        },
        result,
        PartnershipResearchSourceType.OFFICIAL_WEBSITE,
        true,
        '',
      ),
    ];
  }

  // WEAK: only create if title looks like a real institution name
  if (isGenericListTitle(result.title) || !INSTITUTION_NAME_HINT.test(result.title)) {
    return [];
  }
  const name = normalizeInstitutionDisplayName(cleanInstitutionTitle(result.title));
  if (!name || isGenericListTitle(name) || isInvalidNonInstitutionName(name)) {
    return [];
  }
  if (classifyCandidateQuality({ name, body: result.snippet ?? '' }) !== 'VALID_INSTITUTION') {
    return [];
  }
  const signals = detectSignals(`${result.title} ${result.snippet ?? ''}`);
  return [
    finalizeDraft(
      {
        discoveredName: name,
        signals,
        evidence: baseEvidence(name, result, sourceType, signals),
      },
      result,
      sourceType,
      false,
      'Low-confidence search result — requires human review.',
    ),
  ];
}

/**
 * @deprecated Prefer extractCandidatesFromDiscovery. Kept for callers expecting a single draft.
 * Returns first candidate or a skipped placeholder.
 */
export function extractCandidateFromDiscovery(
  result: DiscoveryResult,
  pageText?: string | null,
): ExtractedCandidateDraft {
  const all = extractCandidatesFromDiscovery(result, pageText);
  if (all.length > 0) return all[0];
  return {
    discoveredName: result.title,
    sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
    sourceName: result.provider,
    sourceUrl: result.url,
    confidence: 'LOW',
    likelyOfficialWebsite: false,
    skipAsInstitution: true,
    notes: 'No institution extracted from search result / article title.',
    signals: emptySignals(),
    evidence: [],
  };
}

export type ArticleInstitutionPartial = {
  discoveredName: string;
  website?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  googleMapsUrl?: string;
  signals: ExtractedCandidateDraft['signals'];
  evidence: ExtractedCandidateDraft['evidence'];
};

/** Updated each time extractInstitutionsFromArticleContent runs (for validation/reporting). */
export const lastExtractionQualityStats = {
  rejectedNonInstitution: 0,
  insufficientEvidence: 0,
  accepted: 0,
};

/**
 * Parse article/directory text into institution sections with local contact association.
 */
export function extractInstitutionsFromArticleContent(
  rawText: string,
  sourceUrl: string,
  sourceType: PartnershipResearchSourceType = PartnershipResearchSourceType.PUBLIC_DIRECTORY,
): ArticleInstitutionPartial[] {
  lastExtractionQualityStats.rejectedNonInstitution = 0;
  lastExtractionQualityStats.insufficientEvidence = 0;
  lastExtractionQualityStats.accepted = 0;
  const text = htmlToReadableText(rawText);
  if (!text.trim()) return [];

  const sections = splitInstitutionSections(text);
  const results: ArticleInstitutionPartial[] = [];

  for (const section of sections) {
    const name = normalizeInstitutionDisplayName(cleanSectionInstitutionName(section.heading));
    if (!name || isGenericListTitle(name)) continue;
    if (isInvalidNonInstitutionName(name)) {
      lastExtractionQualityStats.rejectedNonInstitution += 1;
      continue;
    }
    if (!INSTITUTION_NAME_HINT.test(name) && !hasInstitutionAcronym(name)) {
      lastExtractionQualityStats.rejectedNonInstitution += 1;
      continue;
    }

    const fields = extractContactFieldsFromSection(section.body);
    const website = fields.website ? normalizeExtractedWebsite(fields.website) : undefined;
    const safeWebsite =
      website && normalizeWebsiteDomain(website) !== normalizeWebsiteDomain(sourceUrl)
        ? website
        : undefined;

    const quality = classifyCandidateQuality({
      name,
      body: section.body,
      email: fields.email,
      phone: fields.phone,
      website: safeWebsite,
      address: fields.address,
    });
    if (quality === 'INVALID_NON_INSTITUTION') {
      lastExtractionQualityStats.rejectedNonInstitution += 1;
      continue;
    }
    if (quality === 'INSUFFICIENT_EVIDENCE') {
      lastExtractionQualityStats.insufficientEvidence += 1;
      continue;
    }

    const signals = detectSignals(`${section.heading}\n${section.body}`);
    const evidence: ExtractedCandidateDraft['evidence'] = [
      {
        field: 'name',
        value: name,
        sourceUrl,
        sourceType,
        confidence: 'MEDIUM',
      },
      {
        field: 'discoverySource',
        value: sourceUrl,
        sourceUrl,
        sourceType: PartnershipResearchSourceType.SEARCH_ENGINE,
        confidence: 'MEDIUM',
      },
    ];

    pushFieldEvidence(evidence, 'email', fields.email, sourceUrl, sourceType);
    pushFieldEvidence(evidence, 'phone', fields.phone, sourceUrl, sourceType);
    pushFieldEvidence(evidence, 'whatsapp', fields.whatsapp, sourceUrl, sourceType);
    pushFieldEvidence(evidence, 'address', fields.address, sourceUrl, sourceType);
    pushFieldEvidence(evidence, 'website', safeWebsite, sourceUrl, sourceType);

    for (const [key, active] of Object.entries(signals)) {
      if (active) {
        evidence.push({
          field: key,
          value: 'true',
          sourceUrl,
          sourceType,
          confidence: 'MEDIUM',
        });
      }
    }

    results.push({
      discoveredName: name,
      website: safeWebsite,
      email: fields.email,
      phone: fields.phone,
      whatsapp: fields.whatsapp,
      address: fields.address,
      signals,
      evidence,
    });
    lastExtractionQualityStats.accepted += 1;
  }

  // Fallback: name-only list items when no structured sections were found
  if (results.length === 0) {
    for (const line of text.split(/\n+/)) {
      const cleaned = normalizeInstitutionDisplayName(
        cleanSectionInstitutionName(line.replace(/^[-*•]\s*/, '')),
      );
      if (!cleaned || cleaned.length < 4 || cleaned.length > 120) continue;
      if (isGenericListTitle(cleaned)) continue;
      if (isInvalidNonInstitutionName(cleaned)) {
        lastExtractionQualityStats.rejectedNonInstitution += 1;
        continue;
      }
      if (!INSTITUTION_NAME_HINT.test(cleaned) && !hasInstitutionAcronym(cleaned)) continue;
      if (CONTACT_LABELS.phone.test(cleaned) || CONTACT_LABELS.email.test(cleaned)) continue;
      const quality = classifyCandidateQuality({ name: cleaned });
      if (quality !== 'VALID_INSTITUTION') {
        if (quality === 'INVALID_NON_INSTITUTION') {
          lastExtractionQualityStats.rejectedNonInstitution += 1;
        } else {
          lastExtractionQualityStats.insufficientEvidence += 1;
        }
        continue;
      }
      results.push({
        discoveredName: cleaned,
        signals: emptySignals(),
        evidence: [
          {
            field: 'name',
            value: cleaned,
            sourceUrl,
            sourceType,
            confidence: 'LOW',
          },
          {
            field: 'discoverySource',
            value: sourceUrl,
            sourceUrl,
            sourceType: PartnershipResearchSourceType.SEARCH_ENGINE,
            confidence: 'MEDIUM',
          },
        ],
      });
      lastExtractionQualityStats.accepted += 1;
    }
  }

  return dedupePartialsSameSource(results);
}

export function htmlToReadableText(html: string): string {
  if (!html) return '';
  let text = html;

  // Drop non-content chrome before parsing (TOC, nav, scripts, etc.)
  text = text.replace(/<\s*(script|style|noscript|svg|iframe)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ');
  text = text.replace(/<\s*nav\b[^>]*>[\s\S]*?<\s*\/\s*nav\s*>/gi, ' ');
  text = text.replace(/<\s*footer\b[^>]*>[\s\S]*?<\s*\/\s*footer\s*>/gi, ' ');
  text = text.replace(/<\s*header\b[^>]*>[\s\S]*?<\s*\/\s*header\s*>/gi, ' ');
  text = text.replace(/<\s*aside\b[^>]*>[\s\S]*?<\s*\/\s*aside\s*>/gi, ' ');
  // EduMarket / WordPress table-of-contents widgets
  text = text.replace(
    /<\s*(?:div|nav)[^>]*(?:ez-toc|table-of-contents|toc-container|wp-block-yoast)[^>]*>[\s\S]*?<\s*\/\s*(?:div|nav)\s*>/gi,
    ' ',
  );

  // Prefer headings as markdown-like markers for sectioning
  text = text.replace(/<\s*h([1-3])[^>]*>([\s\S]*?)<\s*\/\s*h\1\s*>/gi, (_m, _level, inner) => {
    const innerText = stripTags(inner).trim();
    return `\n## ${innerText}\n`;
  });
  text = text.replace(/<\s*br\s*\/?\s*>/gi, '\n');
  text = text.replace(/<\s*\/\s*p\s*>/gi, '\n');
  text = text.replace(/<\s*li[^>]*>/gi, '\n- ');
  text = text.replace(/<\s*\/\s*(div|section|article|tr)\s*>/gi, '\n');
  // Keep hrefs as text annotations for website extraction
  text = text.replace(
    /<\s*a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\s*\/\s*a\s*>/gi,
    (_m, href, inner) => `${stripTags(inner)} (${href})`,
  );
  text = stripTags(text);
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
}

function splitInstitutionSections(text: string): Array<{ heading: string; body: string }> {
  const lines = text.split(/\n/);
  const sections: Array<{ heading: string; body: string }> = [];
  let current: { heading: string; body: string[] } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (current) current.body.push('');
      continue;
    }

    const headingText = line.replace(/^#{1,3}\s+/, '').trim();
    const isMarkdownHeading = /^#{1,3}\s+\S/.test(line);
    const isContactHeading =
      /^معلومات\s+التواصل\s+مع\s+/i.test(headingText) ||
      /^contact\s+(info|information|details)\b/i.test(headingText);

    // Contact sub-headings stay inside the current institution section
    if (isContactHeading) {
      if (current) current.body.push(headingText);
      continue;
    }

    const isFieldLine =
      CONTACT_LABELS.phone.test(line) ||
      CONTACT_LABELS.email.test(line) ||
      CONTACT_LABELS.website.test(line) ||
      CONTACT_LABELS.address.test(line) ||
      CONTACT_LABELS.whatsapp.test(line);

    const isInstitutionHeading =
      !isFieldLine &&
      line.length <= 160 &&
      !line.endsWith('.') &&
      (INSTITUTION_NAME_HINT.test(headingText) || hasInstitutionAcronym(headingText)) &&
      !isGenericListTitle(headingText) &&
      (isMarkdownHeading || looksLikeStandaloneInstitutionTitle(headingText));

    if (isInstitutionHeading) {
      if (current && current.heading) {
        sections.push({ heading: current.heading, body: current.body.join('\n') });
      }
      current = {
        heading: headingText,
        body: [],
      };
      continue;
    }

    if (!current) {
      continue;
    }

    current.body.push(line);
  }

  if (current && current.heading) {
    sections.push({ heading: current.heading, body: current.body.join('\n') });
  }

  return sections;
}

function looksLikeStandaloneInstitutionTitle(name: string): boolean {
  // Avoid turning prose sentences into headings
  if (/\b(another|third|short|description|guide|list)\b/i.test(name)) return false;
  if (name.split(/\s+/).length < 2) return hasInstitutionAcronym(name);
  return (
    /\b(International|British|American|Canadian|German|French|Italian|STEM|Public)\b/i.test(
      name,
    ) || /مدرسة|مدارس|أكاديمية|اكاديمية/.test(name)
  );
}

function extractContactFieldsFromSection(body: string): {
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  whatsapp?: string;
} {
  const out: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    whatsapp?: string;
  } = {};

  for (const rawLine of body.split(/\n+/)) {
    const line = rawLine.trim();
    if (!line) continue;

    for (const [field, re] of Object.entries(CONTACT_LABELS) as Array<
      [keyof typeof CONTACT_LABELS, RegExp]
    >) {
      const match = line.match(re);
      if (!match?.[1]) continue;
      const value = match[1].trim().replace(/\s+/g, ' ');
      if (!value) continue;
      if (field === 'email' && !out.email) {
        const email = value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
        if (email) out.email = email.toLowerCase();
      } else if (field === 'phone' && !out.phone) {
        out.phone = value;
      } else if (field === 'whatsapp' && !out.whatsapp) {
        out.whatsapp = value;
      } else if (field === 'website' && !out.website) {
        out.website = value.replace(/^<|>$/g, '').trim();
      } else if (field === 'address' && !out.address) {
        out.address = value;
      }
    }

    // Bare email / url in section body (still scoped to this section)
    if (!out.email) {
      const email = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
      if (email) out.email = email.toLowerCase();
    }
    if (!out.website) {
      const urlMatch = line.match(/https?:\/\/[^\s)]+/i)?.[0];
      if (urlMatch) out.website = urlMatch;
    }
  }

  return out;
}

function cleanSectionInstitutionName(heading: string): string {
  return normalizeInstitutionDisplayName(heading);
}

function hasInstitutionAcronym(name: string): boolean {
  return /\b[A-Z]{2,6}\b/.test(name) && /[A-Za-z]/.test(name);
}

function looksLikeInstitutionDomain(domain?: string): boolean {
  if (!domain) return false;
  return (
    domain.endsWith('.edu.eg') ||
    domain.endsWith('.sch.eg') ||
    domain.includes('school') ||
    domain.includes('academy')
  );
}

function normalizeExtractedWebsite(value: string): string | undefined {
  const trimmed = value.trim().replace(/[.,;]+$/, '');
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return undefined;
}

function detectSignals(text: string): ExtractedCandidateDraft['signals'] {
  const signals = emptySignals();
  for (const pattern of TECH_PATTERNS) {
    if (pattern.re.test(text)) signals[pattern.key] = true;
  }
  return signals;
}

function emptySignals(): ExtractedCandidateDraft['signals'] {
  return {
    hasCoding: false,
    hasRobotics: false,
    hasStem: false,
    hasAi: false,
    hasTechClub: false,
    hasAfterSchool: false,
    hasSummerCamp: false,
    hasMakerspace: false,
  };
}

function baseEvidence(
  name: string,
  result: DiscoveryResult,
  sourceType: PartnershipResearchSourceType,
  signals: ExtractedCandidateDraft['signals'],
): ExtractedCandidateDraft['evidence'] {
  const evidence: ExtractedCandidateDraft['evidence'] = [
    {
      field: 'name',
      value: name,
      sourceUrl: result.url,
      sourceType,
      confidence: 'MEDIUM',
    },
    {
      field: 'searchResult',
      value: result.url,
      sourceUrl: result.url,
      sourceType: PartnershipResearchSourceType.SEARCH_ENGINE,
      confidence: 'MEDIUM',
    },
  ];
  if (result.snippet) {
    evidence.push({
      field: 'snippet',
      value: result.snippet.slice(0, 500),
      sourceUrl: result.url,
      sourceType,
      confidence: 'LOW',
    });
  }
  for (const [key, active] of Object.entries(signals)) {
    if (active) {
      evidence.push({
        field: key,
        value: 'true',
        sourceUrl: result.url,
        sourceType,
        confidence: 'MEDIUM',
      });
    }
  }
  return evidence;
}

function finalizeDraft(
  partial: ArticleInstitutionPartial,
  result: DiscoveryResult,
  sourceType: PartnershipResearchSourceType,
  likelyOfficialWebsite: boolean,
  notes: string,
): ExtractedCandidateDraft {
  const confidence: ExtractedCandidateDraft['confidence'] =
    partial.email || partial.phone || partial.website
      ? 'HIGH'
      : likelyOfficialWebsite
        ? 'HIGH'
        : 'MEDIUM';

  return {
    discoveredName: partial.discoveredName,
    website: partial.website,
    email: partial.email,
    phone: partial.phone,
    mobile: partial.mobile,
    whatsapp: partial.whatsapp,
    address: partial.address,
    facebook: partial.facebook,
    instagram: partial.instagram,
    linkedin: partial.linkedin,
    youtube: partial.youtube,
    tiktok: partial.tiktok,
    googleMapsUrl: partial.googleMapsUrl,
    sourceType,
    sourceName: result.provider,
    sourceUrl: result.url,
    snippet: result.snippet,
    domain: normalizeWebsiteDomain(partial.website) ?? undefined,
    confidence,
    likelyOfficialWebsite,
    skipAsInstitution: false,
    notes,
    signals: partial.signals,
    evidence: partial.evidence,
  };
}

function mapSourceType(
  result: DiscoveryResult,
  kind: DiscoverySourceKind,
): PartnershipResearchSourceType {
  if (kind === 'DISCOVERY_SOURCE' || kind === 'DIRECTORY_LISTING') {
    return PartnershipResearchSourceType.PUBLIC_DIRECTORY;
  }
  if (
    Object.values(PartnershipResearchSourceType).includes(
      result.sourceType as PartnershipResearchSourceType,
    )
  ) {
    return result.sourceType as PartnershipResearchSourceType;
  }
  return PartnershipResearchSourceType.SEARCH_ENGINE;
}

/**
 * Extract one institution from a directory listing detail page
 * (e.g. kidsdirectory.com.eg/ad/alpha-language-schools-in-el-obour/).
 * sourceUrl stays the directory page; website is only set when a real school site is found.
 */
function extractDirectoryListingProfile(
  rawHtmlOrText: string,
  result: DiscoveryResult,
  sourceType: PartnershipResearchSourceType,
): ExtractedCandidateDraft | null {
  const name = normalizeInstitutionDisplayName(cleanInstitutionTitle(result.title));
  if (!name || isGenericListTitle(name) || isInvalidNonInstitutionName(name)) {
    return null;
  }
  if (!INSTITUTION_NAME_HINT.test(name) && !hasInstitutionAcronym(name)) {
    return null;
  }

  const fields = extractPublicListingFields(rawHtmlOrText, result.url);
  const quality = classifyCandidateQuality({
    name,
    body: rawHtmlOrText.slice(0, 4000),
    email: fields.email,
    phone: fields.phone,
    website: fields.website,
    address: fields.address,
  });
  if (quality !== 'VALID_INSTITUTION') {
    return null;
  }

  const signals = detectSignals(`${result.title}\n${rawHtmlOrText.slice(0, 3000)}`);
  const evidence = baseEvidence(name, result, sourceType, signals);
  // Mark discovery vs evidence provenance
  evidence.push({
    field: 'discoverySource',
    value: result.provider || 'WEB_SEARCH',
    sourceUrl: result.url,
    sourceType: PartnershipResearchSourceType.SEARCH_ENGINE,
    confidence: 'MEDIUM',
  });
  evidence.push({
    field: 'evidenceSource',
    value: sourceDisplayName(result.url),
    sourceUrl: result.url,
    sourceType,
    confidence: 'HIGH',
  });
  pushFieldEvidence(evidence, 'email', fields.email, result.url, sourceType);
  pushFieldEvidence(evidence, 'phone', fields.phone, result.url, sourceType);
  pushFieldEvidence(evidence, 'whatsapp', fields.whatsapp, result.url, sourceType);
  pushFieldEvidence(evidence, 'address', fields.address, result.url, sourceType);
  pushFieldEvidence(evidence, 'website', fields.website, result.url, sourceType);
  pushFieldEvidence(evidence, 'facebook', fields.facebook, result.url, sourceType);
  pushFieldEvidence(evidence, 'instagram', fields.instagram, result.url, sourceType);
  pushFieldEvidence(evidence, 'googleMapsUrl', fields.googleMapsUrl, result.url, sourceType);

  return finalizeDraft(
    {
      discoveredName: name,
      website: fields.website,
      email: fields.email,
      phone: fields.phone,
      whatsapp: fields.whatsapp,
      address: fields.address,
      facebook: fields.facebook,
      instagram: fields.instagram,
      googleMapsUrl: fields.googleMapsUrl,
      signals,
      evidence,
    },
    result,
    sourceType,
    false,
    'Extracted from public directory listing detail page.',
  );
}

export type PublicListingFields = {
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  googleMapsUrl?: string;
};

/**
 * Extract contact fields from a public directory listing page (KidsDirectory /ad/...).
 * Exported for missing-field enrichment reuse.
 */
export function extractPublicListingFields(raw: string, sourceUrl: string): PublicListingFields {
  const out: PublicListingFields = {};
  const sourceDomain = normalizeWebsiteDomain(sourceUrl);

  const mailto = raw.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)?.[1];
  if (mailto) out.email = mailto.toLowerCase();

  const tel = raw.match(/tel:([+\d][\d\s-]{6,})/i)?.[1];
  if (tel) out.phone = tel.replace(/\s+/g, ' ').trim();

  const fb = raw.match(/https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>]+/i)?.[0];
  if (fb && !/sharer|share\.php/i.test(fb)) {
    out.facebook = fb.replace(/["'<>].*$/, '');
  }

  const ig = raw.match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>]+/i)?.[0];
  if (ig && !/sharer/i.test(ig)) {
    out.instagram = ig.replace(/["'<>].*$/, '');
  }

  const maps = raw.match(
    /https?:\/\/(?:maps\.google\.[^\s"'<>]+|www\.google\.[^\s"'<>]*\/maps[^\s"'<>]*|goo\.gl\/maps\/[^\s"'<>]+|maps\.app\.goo\.gl\/[^\s"'<>]+)/i,
  )?.[0];
  if (maps) {
    out.googleMapsUrl = maps.replace(/["'<>].*$/, '');
  }

  // Explicit non-social website hrefs (KidsDirectory "Website" field)
  const hrefs = [...raw.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map((m) => m[1]);
  for (const href of hrefs) {
    const domain = normalizeWebsiteDomain(href);
    if (!domain || domain === sourceDomain) continue;
    if (
      /facebook\.com|instagram\.com|linkedin\.com|youtube\.com|tiktok\.com|maps\.google|google\.[^/]+\/maps|gmpg\.org|w3\.org|schema\.org|wordpress\.org|cloudflare\.com|fonts\.googleapis|fonts\.gstatic|googletagmanager|google-analytics|gstatic\.com|\.css(?:\?|$)|\.js(?:\?|$)/i.test(
        href,
      )
    ) {
      continue;
    }
    // Prefer labeled website from text over random footer/chrome links
    out.website = href.replace(/["'<>].*$/, '');
    break;
  }

  const text = htmlToReadableText(raw);
  const labeled = extractLabeledDirectoryFields(text);
  out.email = out.email ?? labeled.email;
  out.phone = out.phone ?? labeled.phone;
  out.whatsapp = out.whatsapp ?? labeled.whatsapp ?? out.phone;
  out.address = out.address ?? labeled.address?.replace(/^[-*•]\s*/, '');

  const candidateWebsite = labeled.website
    ? normalizeExtractedWebsite(labeled.website)
    : undefined;
  if (
    candidateWebsite &&
    normalizeWebsiteDomain(candidateWebsite) !== sourceDomain &&
    !/facebook\.com|instagram\.com|linkedin\.com|youtube\.com|tiktok\.com|gmpg\.org/i.test(
      candidateWebsite,
    )
  ) {
    // Labeled website wins over first random href
    out.website = candidateWebsite;
  }

  // Drop directory chrome social profiles (EgyptDirectory site chrome, not school pages)
  if (out.facebook && /EgyptDirectory|egypt.?kids.?directory|KidsDirectory/i.test(out.facebook)) {
    out.facebook = undefined;
  }
  if (out.instagram && /egypt.?kids.?directory|KidsDirectory/i.test(out.instagram)) {
    out.instagram = undefined;
  }
  if (out.website && /gmpg\.org|w3\.org|schema\.org|fonts\.googleapis|fonts\.gstatic|\.css(?:\?|$)/i.test(out.website)) {
    out.website = undefined;
  }

  if (!out.address) {
    const cityMatch = text.match(/City\/Area\s*\n+([^\n]+)/i);
    if (cityMatch?.[1]) {
      out.address = cityMatch[1].trim().replace(/^[-*•]\s*/, '');
    }
  }

  // Fallback: bare public contacts on official pages (no KidsDirectory-style labels).
  if (!out.email) {
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
    for (const rawEmail of emails) {
      const email = rawEmail.toLowerCase();
      if (isJunkPublicEmail(email)) continue;
      out.email = email;
      break;
    }
  } else if (isJunkPublicEmail(out.email)) {
    out.email = undefined;
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
    for (const rawEmail of emails) {
      const email = rawEmail.toLowerCase();
      if (isJunkPublicEmail(email)) continue;
      out.email = email;
      break;
    }
  }
  if (!out.phone) {
    const phones =
      text.match(
        /(?:\+?20[\s-]?)?(?:0?1[0125][\s-]?\d{3}[\s-]?\d{4}|0?[23][\s-]?\d{3,4}[\s-]?\d{4}|0?\d{2}[\s-]?\d{7,8})/g,
      ) ?? [];
    for (const phone of phones) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 8 || digits.length > 15) continue;
      // Skip years / zip-like noise
      if (/^(19|20)\d{2}$/.test(digits)) continue;
      out.phone = phone.replace(/\s+/g, ' ').trim();
      break;
    }
  }

  return out;
}

function isJunkPublicEmail(email: string): boolean {
  return /(?:noreply|no-reply|donotreply|privacy|sentry|wixpress|example\.com|cloudflare|schema\.org|wordpress)/i.test(
    email,
  );
}

export function sourceDisplayName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    if (host.includes('kidsdirectory.')) return 'KidsDirectory';
    if (host.includes('edumarket.')) return 'EduMarket';
    if (host.includes('edarabia.')) return 'Edarabia';
    if (host.includes('facebook.')) return 'Facebook';
    if (host.includes('instagram.')) return 'Instagram';
    return host;
  } catch {
    return 'Public source';
  }
}

/**
 * KidsDirectory uses heading-then-value blocks:
 * Call us / 010… / E-mail / a@b.com / Website / https://…
 */
function extractLabeledDirectoryFields(text: string): {
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  whatsapp?: string;
} {
  const out: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    whatsapp?: string;
  } = {};

  const pairs: Array<{ label: RegExp; field: keyof typeof out }> = [
    { label: /^(?:call\s*us|phone|tel|telephone|hotline|الهاتف)$/i, field: 'phone' },
    { label: /^(?:e-?mail|email|البريد)$/i, field: 'email' },
    { label: /^(?:whatsapp|واتساب)$/i, field: 'whatsapp' },
    { label: /^(?:website|web\s*site|site|الموقع)$/i, field: 'website' },
    { label: /^(?:address|العنوان)$/i, field: 'address' },
  ];

  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length - 1; i += 1) {
    const label = lines[i];
    const value = lines[i + 1];
    for (const pair of pairs) {
      if (!pair.label.test(label) || out[pair.field]) continue;
      if (pair.field === 'email') {
        const email = value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
        if (email) out.email = email.toLowerCase();
      } else if (pair.field === 'phone' || pair.field === 'whatsapp') {
        if (/[\d+][\d\s-]{6,}/.test(value)) {
          out[pair.field] = value;
        }
      } else {
        out[pair.field] = value;
      }
    }
  }

  // Also reuse colon-labeled section parser
  const colonFields = extractContactFieldsFromSection(text);
  out.email = out.email ?? colonFields.email;
  out.phone = out.phone ?? colonFields.phone;
  out.whatsapp = out.whatsapp ?? colonFields.whatsapp;
  out.website = out.website ?? colonFields.website;
  out.address = out.address ?? colonFields.address;

  return out;
}

function pushFieldEvidence(
  evidence: ExtractedCandidateDraft['evidence'],
  field: string,
  value: string | undefined,
  sourceUrl: string,
  sourceType: PartnershipResearchSourceType,
): void {
  if (!value) return;
  evidence.push({
    field,
    value,
    sourceUrl,
    sourceType,
    confidence: 'MEDIUM',
  });
}

/**
 * Same-source conservative dedupe: domain → phone → email → name → known alias.
 * Richer candidate wins; weaker name kept as alias evidence.
 */
function dedupePartialsSameSource(items: ArticleInstitutionPartial[]): ArticleInstitutionPartial[] {
  const groups: ArticleInstitutionPartial[] = [];
  const keyToIndex = new Map<string, number>();

  for (const item of items) {
    const keys = sameSourceIdentityKeys(item, { softAlias: true });
    let matchIdx: number | undefined;
    for (const key of keys) {
      const found = keyToIndex.get(key);
      if (found !== undefined) {
        matchIdx = found;
        break;
      }
    }

    if (matchIdx === undefined) {
      const idx = groups.length;
      groups.push(item);
      for (const key of keys) {
        keyToIndex.set(key, idx);
      }
      continue;
    }

    const merged = pickRicherPartial(groups[matchIdx], item);
    groups[matchIdx] = merged;
    for (const key of sameSourceIdentityKeys(merged, { softAlias: true })) {
      keyToIndex.set(key, matchIdx);
    }
  }

  return groups;
}

function partialRichness(item: ArticleInstitutionPartial): number {
  let score = 0;
  if (item.email) score += 3;
  if (item.phone) score += 3;
  if (item.website) score += 3;
  if (item.whatsapp) score += 2;
  if (item.address) score += 2;
  score += Math.min(item.evidence.length, 8);
  return score;
}

function pickRicherPartial(
  a: ArticleInstitutionPartial,
  b: ArticleInstitutionPartial,
): ArticleInstitutionPartial {
  const winner = partialRichness(b) > partialRichness(a) ? b : a;
  const loser = winner === a ? b : a;
  const evidence = [...winner.evidence];
  const loserKey = normalizeInstitutionKey(loser.discoveredName);
  const winnerKey = normalizeInstitutionKey(winner.discoveredName);
  if (loserKey && loserKey !== winnerKey) {
    const already = evidence.some(
      (e) => e.field === 'alias' && normalizeInstitutionKey(e.value) === loserKey,
    );
    if (!already) {
      evidence.push({
        field: 'alias',
        value: loser.discoveredName,
        sourceUrl: loser.evidence[0]?.sourceUrl ?? winner.evidence[0]?.sourceUrl ?? '',
        sourceType:
          loser.evidence[0]?.sourceType ??
          winner.evidence[0]?.sourceType ??
          PartnershipResearchSourceType.PUBLIC_DIRECTORY,
        confidence: 'MEDIUM',
      });
    }
  }

  return {
    ...winner,
    email: winner.email ?? loser.email,
    phone: winner.phone ?? loser.phone,
    mobile: winner.mobile ?? loser.mobile,
    whatsapp: winner.whatsapp ?? loser.whatsapp,
    website: winner.website ?? loser.website,
    address: winner.address ?? loser.address,
    facebook: winner.facebook ?? loser.facebook,
    instagram: winner.instagram ?? loser.instagram,
    linkedin: winner.linkedin ?? loser.linkedin,
    youtube: winner.youtube ?? loser.youtube,
    tiktok: winner.tiktok ?? loser.tiktok,
    evidence,
    signals: {
      hasCoding: winner.signals.hasCoding || loser.signals.hasCoding,
      hasRobotics: winner.signals.hasRobotics || loser.signals.hasRobotics,
      hasStem: winner.signals.hasStem || loser.signals.hasStem,
      hasAi: winner.signals.hasAi || loser.signals.hasAi,
      hasTechClub: winner.signals.hasTechClub || loser.signals.hasTechClub,
      hasAfterSchool: winner.signals.hasAfterSchool || loser.signals.hasAfterSchool,
      hasSummerCamp: winner.signals.hasSummerCamp || loser.signals.hasSummerCamp,
      hasMakerspace: winner.signals.hasMakerspace || loser.signals.hasMakerspace,
    },
  };
}

function stripTags(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}
