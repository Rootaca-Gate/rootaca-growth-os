import { normalizeEmail, normalizePhone, normalizeWebsiteDomain } from '../../common/partnership.normalize';

export type CandidateQualityClass =
  | 'VALID_INSTITUTION'
  | 'INVALID_NON_INSTITUTION'
  | 'INSUFFICIENT_EVIDENCE';

export type QualityGateInput = {
  name: string;
  body?: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
};

/** Strong institution name tokens (sufficient with multi-word identity or light evidence). */
const STRONG_POSITIVE_NAME =
  /\b(international\s+school|british\s+school|american\s+school|language\s+school|national\s+school|stem\s+school|international\s+college|schools?)\b|مدرسة|مدارس|مدرسة\s+دولية|مدارس\s+دولية|مدرسة\s+لغات|مدارس\s+لغات|المدرسة\s+البريطانية|المدرسة\s+الأمريكية|المدرسة\s+الامريكية|المدرسة\s+الدولية|مدارس\s+النيل|مدارس\s+مصرية/i;

/** Weak educational terms — require supporting contact/context evidence. */
const WEAK_POSITIVE_NAME = /\b(academy|college)\b|أكاديمية|اكاديمية/i;

const NEGATIVE_NAME =
  /\b(faq|frequently\s+asked\s+questions|tuition(?:\s+fees)?|\bfees?\b|\bcosts?\b|logistics|transportation|school\s+bus|\blocation\b|contact\s+us|\bcontact\b|admissions?|admission\s+process|why\s+choose|how\s+to\s+apply|requirements|facilities|\bcurriculum\b|conclusion|introduction|\bguide\b|top\s+schools?|best\s+schools?|school\s+guide|campus\s+guide|tech\s+revolution)\b|الأسئلة\s+الشائعة|المصروفات|الرسوم|التكاليف|النقل|الأتوبيس|اتصل\s+بنا|التواصل|التقديم|شروط\s+التقديم|لماذا\s+تختار|المرافق|المنهج|الخلاصة|المقدمة|دليل\s+المدارس|أفضل\s+المدارس|افضل\s+المدارس|مدارس\s+الشروق|مدارس\s+مدينة\s+الشروق/i;

const PRICE_NAME =
  /\b(egp|usd|sar|aed|fees?\s+start|starts?\s+from)\b|ج\.?\s*م|جنيه|تبدأ\s+من|يبدأ\s+من|المصروفات\s+تبدأ|الرسوم\s+تبدأ|\$\s*\d|\d[\d,]+\s*(ج|جنيه|egp)/i;

/** Known abbreviation aliases — only used with shared contact/domain evidence or same-source soft merge. */
const ALIAS_GROUPS: string[][] = [
  [
    'nis',
    'nermien ismail',
    'nermien ismail schools',
    'مدارس الدكتور نرمين اسماعيل',
    'مدارس الدكتور نرمين إسماعيل',
    'نرمين اسماعيل',
    'نرمين إسماعيل',
  ],
  [
    'renaissance international school of egypt',
    'renaissance international school',
    'مدرسة رينيسانس الدولية',
    'رينيسانس الدولية',
  ],
  ['ips el shorouk', 'ips', 'international public school'],
  ['british school of elite education', 'bsee', 'مدرسة البريطانية للنخبة'],
  ['dover international school', 'dover'],
];

/**
 * Strip list numbering / decorative noise from institution headings.
 */
export function normalizeInstitutionDisplayName(raw: string): string {
  return raw
    .replace(/^#{1,3}\s+/, '')
    .replace(/^\d{1,2}[.)\-–—]\s*/, '')
    .replace(/^معلومات\s+التواصل\s+مع\s+/i, '')
    .replace(/\s*\(\s*\/[^)]+\/\s*\)\s*$/g, '') // slug leftovers: (/school-slug/)
    .replace(/\s*[\|\-–—]\s*(home|official\s*site|official\s*website).*$/i, '')
    .replace(/\.{2,}\s*$/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeInstitutionKey(name: string): string {
  return normalizeInstitutionDisplayName(name)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifyCandidateQuality(input: QualityGateInput): CandidateQualityClass {
  const name = normalizeInstitutionDisplayName(input.name);
  if (!name || name.length < 3) {
    return 'INVALID_NON_INSTITUTION';
  }

  if (isInvalidNonInstitutionName(name)) {
    return 'INVALID_NON_INSTITUTION';
  }

  const contactCount = countContacts(input);
  const body = input.body ?? '';
  const contextualEvidence = countContextualEvidence(body);
  const evidenceScore = contactCount + contextualEvidence;
  const strongName = STRONG_POSITIVE_NAME.test(name) || hasStrongAcronym(name);
  const weakName = WEAK_POSITIVE_NAME.test(name);
  const wordCount = name.split(/\s+/).filter(Boolean).length;

  if (contactCount < 1) {
    if (strongName || weakName || hasStrongAcronym(name)) {
      return 'INSUFFICIENT_EVIDENCE';
    }
    return 'INVALID_NON_INSTITUTION';
  }

  if (strongName && (contactCount >= 1 || evidenceScore >= 2)) {
    return 'VALID_INSTITUTION';
  }

  if (hasStrongAcronym(name) && contactCount >= 1) {
    return 'VALID_INSTITUTION';
  }

  if (weakName && contactCount >= 1 && wordCount >= 2) {
    return 'VALID_INSTITUTION';
  }

  if (contactCount >= 2 && wordCount >= 2) {
    return 'VALID_INSTITUTION';
  }

  if (strongName || weakName || hasStrongAcronym(name)) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  return 'INVALID_NON_INSTITUTION';
}

export function isInvalidNonInstitutionName(name: string): boolean {
  const n = normalizeInstitutionDisplayName(name);
  if (!n) return true;

  if (PRICE_NAME.test(n)) return true;
  if (NEGATIVE_NAME.test(n)) return true;
  if (/^\(?\s*\/[a-z0-9-]+\/\s*\)?$/i.test(n)) return true;

  // Long prose / truncated article sentences
  if (n.endsWith('...') || n.endsWith('…')) return true;
  if (n.length > 120) return true;
  if ((n.match(/\s+/g) ?? []).length >= 14) return true;

  // Link / CTA stubs mistaken for institution names
  if (/https?:\/\//i.test(n) || /\bwww\./i.test(n)) return true;
  if (/^(details|read more|learn more|see more|click here)\b/i.test(n)) return true;

  // Topic-style "Something: Schools with ..." where left side is not an institution
  if (/^.+:\s*.+\bschools?\b/i.test(n) && !STRONG_POSITIVE_NAME.test(n.split(':')[0] ?? '')) {
    return true;
  }

  // Generic location-only school lists
  if (/^مدارس\s+(الشروق|القاهرة|الجيزة|الإسكندرية|مدينة)/i.test(n) && n.length < 45) {
    return true;
  }

  // Sentence-like openings that are clearly not institution names
  if (/^(the\s+\d{4}|the\s+egyptian\s+schools)\b/i.test(n)) {
    return true;
  }

  return false;
}

export function aliasGroupId(name: string): string | null {
  const key = normalizeInstitutionKey(name);
  if (!key) return null;
  for (let i = 0; i < ALIAS_GROUPS.length; i += 1) {
    const group = ALIAS_GROUPS[i];
    for (const alias of group) {
      if (key === alias) {
        return `alias:${i}`;
      }
      // Long aliases: substring match is safe
      if (alias.length >= 8 && (key.includes(alias) || (key.length >= 8 && alias.includes(key)))) {
        return `alias:${i}`;
      }
      // Short aliases / acronyms: whole-token only
      if (alias.length < 8) {
        const tokenRe = new RegExp(`(?:^|\\s)${escapeRegExp(alias)}(?:\\s|$)`, 'i');
        if (tokenRe.test(key)) {
          return `alias:${i}`;
        }
      }
    }
  }
  return null;
}

/**
 * Same-source merge keys — conservative.
 * Levels: domain → phone → email → exact name → alias (with evidence or soft same-source).
 */
export function sameSourceIdentityKeys(
  item: {
    discoveredName: string;
    website?: string | null;
    email?: string | null;
    phone?: string | null;
  },
  options?: { softAlias?: boolean },
): string[] {
  const keys: string[] = [];
  const domain = normalizeWebsiteDomain(item.website ?? undefined);
  const email = normalizeEmail(item.email ?? undefined);
  const phone = normalizePhone(item.phone ?? undefined);
  const nameKey = normalizeInstitutionKey(item.discoveredName);
  const alias = aliasGroupId(item.discoveredName);

  if (domain) keys.push(`domain:${domain}`);
  if (email) keys.push(`email:${email}`);
  if (phone && phone.replace(/\D/g, '').length >= 8) keys.push(`phone:${phone}`);
  if (nameKey) keys.push(`name:${nameKey}`);
  if (alias && (domain || email || phone || options?.softAlias)) {
    keys.push(alias);
  }
  return keys;
}

function countContacts(input: QualityGateInput): number {
  let n = 0;
  if (input.email) n += 1;
  if (input.phone) n += 1;
  if (input.website) n += 1;
  if (input.address) n += 1;
  return n;
}

function countContextualEvidence(body: string): number {
  if (!body.trim()) return 0;
  let n = 0;
  if (/address|العنوان|عنوان/i.test(body)) n += 1;
  if (/phone|tel|hotline|الهاتف|الخط\s*الساخن|موبايل/i.test(body)) n += 1;
  if (/email|إيميل|ايميل|بريد/i.test(body)) n += 1;
  if (/website|موقع/i.test(body)) n += 1;
  if (/curriculum|منهج|british|american|ib|national/i.test(body)) n += 1;
  if (/admission|قبول|تقديم/i.test(body)) n += 1;
  if (/campus|حرم|فرع/i.test(body)) n += 1;
  if (/kindergarten|primary|secondary|حضانة|ابتدائي|اعدادي|إعدادي|ثانوي/i.test(body)) n += 1;
  return n;
}

function hasStrongAcronym(name: string): boolean {
  return /\b(NIS|IPS|BSEE|HSIS|EBIS|GIS|DAIS)\b/.test(name);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
