export type NavItem = {
  labelKey: string;
  path: string;
  icon: string;
  exact?: boolean;
};

/** Numbered partnership journey group (visual only — not a route). */
export type NavGroup = {
  /** Display number, e.g. "01". Omit for utility groups (tools). */
  stage?: string;
  titleKey: string;
  items: NavItem[];
};

export type NavSection = {
  titleKey: string;
  /** Compact journey strip under the section title (Partnerships). */
  showJourney?: boolean;
  /** Flat items (Home / Students / System). */
  items?: NavItem[];
  /** Grouped items with stage headers (Partnerships). */
  groups?: NavGroup[];
};

/**
 * Main sidebar navigation.
 * Paths must stay in sync with app.routes.ts — do not rename routes here.
 */
export const APP_NAV: NavSection[] = [
  {
    titleKey: 'nav.home',
    items: [{ labelKey: 'nav.dashboard', path: '/dashboard', icon: 'space_dashboard', exact: true }],
  },
  {
    titleKey: 'nav.students',
    items: [
      { labelKey: 'nav.allStudents', path: '/students', icon: 'groups', exact: true },
      { labelKey: 'nav.orientation', path: '/orientation', icon: 'psychology' },
      { labelKey: 'nav.assessments', path: '/assessments', icon: 'assignment' },
      { labelKey: 'nav.learningPaths', path: '/learning-paths', icon: 'alt_route' },
      { labelKey: 'nav.roadmaps', path: '/roadmaps', icon: 'map' },
      { labelKey: 'nav.projects', path: '/projects', icon: 'school', exact: true },
      { labelKey: 'nav.progress', path: '/progress', icon: 'trending_up' },
      { labelKey: 'nav.kpis', path: '/kpis', icon: 'monitoring' },
      { labelKey: 'nav.activity', path: '/activity', icon: 'history' },
    ],
  },
  {
    titleKey: 'nav.partnerships',
    showJourney: true,
    groups: [
      {
        stage: '01',
        titleKey: 'nav.stageDiscovery',
        items: [
          { labelKey: 'nav.leads', path: '/partnerships/leads', icon: 'filter_alt' },
          { labelKey: 'nav.research', path: '/partnerships/research', icon: 'travel_explore' },
        ],
      },
      {
        stage: '02',
        titleKey: 'nav.stageInstitutions',
        items: [
          { labelKey: 'nav.institutions', path: '/partnerships/institutions', icon: 'apartment' },
          { labelKey: 'nav.contacts', path: '/partnerships/contacts', icon: 'contact_page' },
        ],
      },
      {
        stage: '03',
        titleKey: 'nav.stageCatalog',
        items: [
          { labelKey: 'nav.programs', path: '/partnerships/programs', icon: 'menu_book' },
          { labelKey: 'nav.offerings', path: '/partnerships/offerings', icon: 'inventory_2' },
        ],
      },
      {
        stage: '04',
        titleKey: 'nav.stageSales',
        items: [
          { labelKey: 'nav.proposals', path: '/partnerships/proposals', icon: 'request_quote' },
        ],
      },
      {
        stage: '05',
        titleKey: 'nav.stageExecution',
        items: [
          { labelKey: 'nav.sows', path: '/partnerships/sows', icon: 'description' },
          { labelKey: 'nav.delivery', path: '/partnerships/delivery', icon: 'rocket_launch' },
        ],
      },
      {
        stage: '06',
        titleKey: 'nav.stageResults',
        items: [{ labelKey: 'nav.reports', path: '/partnerships/reports', icon: 'assessment' }],
      },
      {
        stage: '07',
        titleKey: 'nav.stageGrowth',
        items: [{ labelKey: 'nav.renewals', path: '/partnerships/renewals', icon: 'autorenew' }],
      },
      {
        stage: '08',
        titleKey: 'nav.stageFollowUp',
        items: [
          { labelKey: 'nav.activities', path: '/partnerships/activities', icon: 'history_edu' },
          { labelKey: 'nav.followUps', path: '/partnerships/follow-ups', icon: 'event_available' },
        ],
      },
      {
        stage: '09',
        titleKey: 'nav.stageTools',
        items: [{ labelKey: 'nav.import', path: '/partnerships/import', icon: 'upload_file' }],
      },
    ],
  },
  {
    titleKey: 'nav.systemAdmin',
    items: [
      { labelKey: 'nav.levels', path: '/levels', icon: 'layers' },
      { labelKey: 'nav.skills', path: '/skills', icon: 'bolt' },
    ],
  },
];

/** Compact journey labels shown under Partnerships (not clickable routes). */
export const PARTNERSHIP_JOURNEY_STEPS = [
  'nav.journeyDiscovery',
  'nav.journeyInstitution',
  'nav.journeyCatalog',
  'nav.journeyProposal',
  'nav.journeyAgreement',
  'nav.journeyDelivery',
  'nav.journeyResults',
  'nav.journeyRenewal',
] as const;

/** True when the current URL belongs to this nav item (supports nested partnership routes). */
export function isNavItemActive(url: string, item: Pick<NavItem, 'path' | 'exact'>): boolean {
  const path = url.split('?')[0].split('#')[0];
  if (item.exact) {
    return path === item.path;
  }
  return path === item.path || path.startsWith(`${item.path}/`);
}

export function sectionItems(section: NavSection): NavItem[] {
  if (section.groups?.length) {
    return section.groups.flatMap((group) => group.items);
  }
  return section.items ?? [];
}

export function findActiveNavSection(
  url: string,
  sections: NavSection[] = APP_NAV,
): NavSection | null {
  for (const section of sections) {
    if (sectionItems(section).some((item) => isNavItemActive(url, item))) {
      return section;
    }
  }
  // Partnership overview route lives outside numbered stages.
  const path = url.split('?')[0].split('#')[0];
  if (path === '/partnerships' || path.startsWith('/partnerships/')) {
    return sections.find((section) => section.titleKey === 'nav.partnerships') ?? null;
  }
  return null;
}
