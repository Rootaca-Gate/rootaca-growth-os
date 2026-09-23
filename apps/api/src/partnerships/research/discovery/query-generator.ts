import { PartnershipResearchLanguage } from '@prisma/client';

export type ResearchQueryInput = {
  governorate?: string | null;
  city?: string | null;
  district?: string | null;
  institutionType?: string | null;
  institutionCategory?: string | null;
  curriculum?: string | null;
  language?: PartnershipResearchLanguage;
  technology?: {
    hasCoding?: boolean;
    hasRobotics?: boolean;
    hasStem?: boolean;
    hasAi?: boolean;
    hasTechClub?: boolean;
    hasAfterSchool?: boolean;
    hasSummerCamp?: boolean;
    hasMakerspace?: boolean;
  };
  maxQueries?: number;
};

export type ResearchQuery = {
  language: 'en' | 'ar';
  template: string;
  text: string;
};

const TYPE_LABELS_EN: Record<string, string> = {
  SCHOOL: 'schools',
  EDUCATION_CENTER: 'education centers',
  CODING_CENTER: 'coding centers',
  STEM_CENTER: 'STEM centers',
  ROBOTICS_CENTER: 'robotics centers',
  AI_CENTER: 'AI education centers',
  LEARNING_CENTER: 'learning centers',
  AFTER_SCHOOL_CENTER: 'after-school centers',
  MAKERSPACE: 'makerspaces',
  OTHER: 'education organizations',
};

const TYPE_LABELS_AR: Record<string, string> = {
  SCHOOL: 'مدارس',
  EDUCATION_CENTER: 'مراكز تعليمية',
  CODING_CENTER: 'مراكز برمجة',
  STEM_CENTER: 'مراكز STEM',
  ROBOTICS_CENTER: 'مراكز روبوتكس',
  AI_CENTER: 'مراكز ذكاء اصطناعي',
  LEARNING_CENTER: 'مراكز تعليم',
  AFTER_SCHOOL_CENTER: 'مراكز بعد المدرسة',
  MAKERSPACE: 'فضاءات تصنيع',
  OTHER: 'مؤسسات تعليمية',
};

const TECH_EN: Array<{ key: keyof NonNullable<ResearchQueryInput['technology']>; label: string }> = [
  { key: 'hasCoding', label: 'coding' },
  { key: 'hasRobotics', label: 'robotics' },
  { key: 'hasStem', label: 'STEM' },
  { key: 'hasAi', label: 'AI' },
  { key: 'hasTechClub', label: 'technology club' },
  { key: 'hasAfterSchool', label: 'after-school' },
  { key: 'hasSummerCamp', label: 'summer program' },
  { key: 'hasMakerspace', label: 'makerspace' },
];

const TECH_AR: Array<{ key: keyof NonNullable<ResearchQueryInput['technology']>; label: string }> = [
  { key: 'hasCoding', label: 'برمجة' },
  { key: 'hasRobotics', label: 'روبوتكس' },
  { key: 'hasStem', label: 'STEM' },
  { key: 'hasAi', label: 'ذكاء اصطناعي' },
  { key: 'hasTechClub', label: 'نادي تقني' },
  { key: 'hasAfterSchool', label: 'بعد المدرسة' },
  { key: 'hasSummerCamp', label: 'معسكر صيفي' },
  { key: 'hasMakerspace', label: 'فضاء تصنيع' },
];

function place(input: ResearchQueryInput): string {
  return [input.city, input.governorate].filter(Boolean).join(', ') || 'Egypt';
}

function placeAr(input: ResearchQueryInput): string {
  return [input.city, input.governorate].filter(Boolean).join(' ') || 'مصر';
}

/**
 * Deterministic query generation from job parameters.
 * No AI. Capped by maxQueries. Stable order.
 */
export function generateResearchQueries(input: ResearchQueryInput): ResearchQuery[] {
  const max = Math.min(Math.max(input.maxQueries ?? 24, 1), 48);
  const lang = input.language ?? PartnershipResearchLanguage.BOTH;
  const queries: ResearchQuery[] = [];
  const seen = new Set<string>();

  const push = (language: 'en' | 'ar', template: string, text: string) => {
    const key = `${language}:${text.toLowerCase()}`;
    if (seen.has(key) || queries.length >= max) {
      return;
    }
    seen.add(key);
    queries.push({ language, template, text });
  };

  const locationEn = place(input);
  const locationAr = placeAr(input);
  const typeEn = input.institutionType
    ? TYPE_LABELS_EN[input.institutionType] ?? 'schools'
    : 'schools';
  const typeAr = input.institutionType
    ? TYPE_LABELS_AR[input.institutionType] ?? 'مدارس'
    : 'مدارس';

  if (lang === PartnershipResearchLanguage.EN || lang === PartnershipResearchLanguage.BOTH) {
    push('en', '{type} in {place} Egypt', `${typeEn} in ${locationEn} Egypt`);
    if (input.curriculum) {
      push(
        'en',
        '{curriculum} schools in {place} Egypt',
        `${input.curriculum} schools in ${locationEn} Egypt`,
      );
    }
    if (input.institutionCategory) {
      push(
        'en',
        '{category} schools in {place} Egypt',
        `${input.institutionCategory.replace(/_/g, ' ').toLowerCase()} schools in ${locationEn} Egypt`,
      );
    }
    for (const tech of TECH_EN) {
      if (input.technology?.[tech.key]) {
        push(
          'en',
          '{technology} {type} in {place} Egypt',
          `${tech.label} ${typeEn} in ${locationEn} Egypt`,
        );
        push(
          'en',
          '{technology} center in {place} Egypt',
          `${tech.label} center in ${locationEn} Egypt`,
        );
      }
    }
  }

  if (lang === PartnershipResearchLanguage.AR || lang === PartnershipResearchLanguage.BOTH) {
    push('ar', '{type} في {place}', `${typeAr} في ${locationAr}`);
    if (input.curriculum) {
      push('ar', 'مدارس {curriculum} في {place}', `مدارس ${input.curriculum} في ${locationAr}`);
    }
    for (const tech of TECH_AR) {
      if (input.technology?.[tech.key]) {
        push('ar', '{technology} في {place}', `${tech.label} في ${locationAr}`);
        push('ar', 'مراكز {technology} في {place}', `مراكز ${tech.label} في ${locationAr}`);
      }
    }
  }

  return queries.slice(0, max);
}
