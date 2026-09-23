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

export const APP_NAV: NavSection[] = [
  {
    titleKey: 'nav.overview',
    items: [{ labelKey: 'nav.dashboard', path: '/dashboard', icon: 'space_dashboard' }],
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
      { labelKey: 'nav.roadmaps', path: '/roadmaps', icon: 'map' },
      { labelKey: 'nav.learningPaths', path: '/learning-paths', icon: 'alt_route' },
      { labelKey: 'nav.projects', path: '/projects', icon: 'school', exact: true },
    ],
  },
  {
    titleKey: 'nav.tracking',
    items: [
      { labelKey: 'nav.kpis', path: '/kpis', icon: 'monitoring' },
      { labelKey: 'nav.progress', path: '/progress', icon: 'trending_up' },
      { labelKey: 'nav.activity', path: '/activity', icon: 'history' },
    ],
  },
  {
    titleKey: 'nav.configuration',
    items: [
      { labelKey: 'nav.levels', path: '/levels', icon: 'layers' },
      { labelKey: 'nav.skills', path: '/skills', icon: 'bolt' },
    ],
  },
  {
    titleKey: 'nav.partnerships',
    items: [
      { labelKey: 'nav.partnershipDashboard', path: '/partnerships', icon: 'handshake', exact: true },
      { labelKey: 'nav.institutions', path: '/partnerships/institutions', icon: 'apartment' },
      { labelKey: 'nav.contacts', path: '/partnerships/contacts', icon: 'contact_page' },
      { labelKey: 'nav.leads', path: '/partnerships/leads', icon: 'filter_alt' },
      { labelKey: 'nav.followUps', path: '/partnerships/follow-ups', icon: 'event_available' },
      { labelKey: 'nav.activities', path: '/partnerships/activities', icon: 'history_edu' },
      { labelKey: 'nav.import', path: '/partnerships/import', icon: 'upload_file' },
      { labelKey: 'nav.research', path: '/partnerships/research', icon: 'travel_explore' },
    ],
  },
];
