export type NavItem = {
  labelKey: string;
  path: string;
  icon: string;
  exact?: boolean;
};

export type NavSection = {
  titleKey: string;
  items: NavItem[];
};

/**
 * Main sidebar navigation. Order matches ROOTACA Admin IA.
 * Do not change paths without updating app.routes.ts.
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
    ],
  },
  {
    titleKey: 'nav.learning',
    items: [
      { labelKey: 'nav.learningPaths', path: '/learning-paths', icon: 'alt_route' },
      { labelKey: 'nav.roadmaps', path: '/roadmaps', icon: 'map' },
      { labelKey: 'nav.projects', path: '/projects', icon: 'school', exact: true },
    ],
  },
  {
    titleKey: 'nav.tracking',
    items: [
      { labelKey: 'nav.progress', path: '/progress', icon: 'trending_up' },
      { labelKey: 'nav.kpis', path: '/kpis', icon: 'monitoring' },
      { labelKey: 'nav.activity', path: '/activity', icon: 'history' },
    ],
  },
  {
    titleKey: 'nav.partnerships',
    items: [
      { labelKey: 'nav.partnershipDashboard', path: '/partnerships', icon: 'handshake', exact: true },
      { labelKey: 'nav.institutions', path: '/partnerships/institutions', icon: 'apartment' },
      { labelKey: 'nav.leads', path: '/partnerships/leads', icon: 'filter_alt' },
      { labelKey: 'nav.contacts', path: '/partnerships/contacts', icon: 'contact_page' },
      { labelKey: 'nav.programs', path: '/partnerships/programs', icon: 'menu_book' },
      { labelKey: 'nav.offerings', path: '/partnerships/offerings', icon: 'inventory_2' },
      { labelKey: 'nav.proposals', path: '/partnerships/proposals', icon: 'request_quote' },
      { labelKey: 'nav.sows', path: '/partnerships/sows', icon: 'description' },
      { labelKey: 'nav.delivery', path: '/partnerships/delivery', icon: 'rocket_launch' },
      { labelKey: 'nav.reports', path: '/partnerships/reports', icon: 'assessment' },
      { labelKey: 'nav.followUps', path: '/partnerships/follow-ups', icon: 'event_available' },
      { labelKey: 'nav.activities', path: '/partnerships/activities', icon: 'history_edu' },
      { labelKey: 'nav.research', path: '/partnerships/research', icon: 'travel_explore' },
      { labelKey: 'nav.import', path: '/partnerships/import', icon: 'upload_file' },
    ],
  },
  {
    titleKey: 'nav.systemAdmin',
    items: [
      { labelKey: 'nav.levels', path: '/levels', icon: 'layers' },
      { labelKey: 'nav.skills', path: '/skills', icon: 'bolt' },
      { labelKey: 'nav.settings', path: '/settings', icon: 'settings' },
    ],
  },
];

/** True when the current URL belongs to this nav item (supports nested partnership routes). */
export function isNavItemActive(url: string, item: NavItem): boolean {
  const path = url.split('?')[0].split('#')[0];
  if (item.exact) {
    return path === item.path;
  }
  return path === item.path || path.startsWith(`${item.path}/`);
}

export function findActiveNavSection(url: string, sections: NavSection[] = APP_NAV): NavSection | null {
  for (const section of sections) {
    if (section.items.some((item) => isNavItemActive(url, item))) {
      return section;
    }
  }
  return null;
}
