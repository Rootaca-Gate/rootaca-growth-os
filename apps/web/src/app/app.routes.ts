import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'orientation',
        loadComponent: () =>
          import('./features/orientation/orientation-hub.page').then((m) => m.OrientationHubPage),
      },
      {
        path: 'assessments',
        loadComponent: () =>
          import('./features/orientation/assessments.page').then((m) => m.AssessmentsPage),
      },
      {
        path: 'roadmaps',
        loadComponent: () =>
          import('./features/roadmap/roadmaps-hub.page').then((m) => m.RoadmapsHubPage),
      },
      {
        path: 'progress',
        loadComponent: () =>
          import('./features/progress/progress-hub.page').then((m) => m.ProgressHubPage),
      },
      {
        path: 'activity',
        loadComponent: () =>
          import('./features/activity/activity.page').then((m) => m.ActivityPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'students/create',
        redirectTo: 'students/new',
        pathMatch: 'full',
      },
      {
        path: 'students',
        loadComponent: () =>
          import('./features/students/students-list.page').then((m) => m.StudentsListPage),
      },
      {
        path: 'levels',
        loadComponent: () => import('./features/placement/levels.page').then((m) => m.LevelsPage),
      },
      {
        path: 'skills',
        loadComponent: () => import('./features/placement/skills.page').then((m) => m.SkillsPage),
      },
      {
        path: 'learning-paths',
        loadComponent: () =>
          import('./features/placement/learning-paths.page').then((m) => m.LearningPathsPage),
      },
      {
        path: 'kpis',
        loadComponent: () => import('./features/kpi/kpis-admin.page').then((m) => m.KpisAdminPage),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/projects-list.page').then((m) => m.ProjectsListPage),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./features/projects/project-details.page').then((m) => m.ProjectDetailsPage),
      },
      {
        path: 'students/new',
        loadComponent: () =>
          import('./features/students/student-create.page').then((m) => m.StudentCreatePage),
      },
      {
        path: 'students/:id/edit',
        loadComponent: () =>
          import('./features/students/student-edit.page').then((m) => m.StudentEditPage),
      },
      {
        path: 'students/:id/orientation/:sessionId',
        loadComponent: () =>
          import('./features/orientation/orientation-wizard.page').then(
            (m) => m.OrientationWizardPage,
          ),
      },
      {
        path: 'students/:id/roadmap',
        loadComponent: () =>
          import('./features/roadmap/student-roadmap.page').then((m) => m.StudentRoadmapPage),
      },
      {
        path: 'students/:id/kpis',
        loadComponent: () =>
          import('./features/kpi/student-kpi.page').then((m) => m.StudentKpiPage),
      },
      {
        path: 'students/:id/projects',
        loadComponent: () =>
          import('./features/projects/student-projects.page').then((m) => m.StudentProjectsPage),
      },
      {
        path: 'students/:id/progress',
        loadComponent: () =>
          import('./features/progress/student-progress.page').then((m) => m.StudentProgressPage),
      },
      {
        path: 'students/:id/report',
        loadComponent: () =>
          import('./features/reports/student-report.page').then((m) => m.StudentReportPage),
      },
      {
        path: 'students/:id',
        loadComponent: () =>
          import('./features/students/student-profile.page').then((m) => m.StudentProfilePage),
      },
      {
        path: 'partnerships',
        loadComponent: () =>
          import('./features/partnerships/partnership-dashboard.page').then(
            (m) => m.PartnershipDashboardPage,
          ),
      },
      {
        path: 'partnerships/institutions',
        loadComponent: () =>
          import('./features/partnerships/institutions-list.page').then(
            (m) => m.InstitutionsListPage,
          ),
      },
      {
        path: 'partnerships/institutions/new',
        loadComponent: () =>
          import('./features/partnerships/institution-create.page').then(
            (m) => m.InstitutionCreatePage,
          ),
      },
      {
        path: 'partnerships/institutions/:id/edit',
        loadComponent: () =>
          import('./features/partnerships/institution-edit.page').then(
            (m) => m.InstitutionEditPage,
          ),
      },
      {
        path: 'partnerships/institutions/:id',
        loadComponent: () =>
          import('./features/partnerships/institution-details.page').then(
            (m) => m.InstitutionDetailsPage,
          ),
      },
      {
        path: 'partnerships/contacts',
        loadComponent: () =>
          import('./features/partnerships/contacts-list.page').then((m) => m.ContactsListPage),
      },
      {
        path: 'partnerships/leads',
        loadComponent: () =>
          import('./features/partnerships/leads-list.page').then((m) => m.LeadsListPage),
      },
      {
        path: 'partnerships/leads/:id',
        loadComponent: () =>
          import('./features/partnerships/lead-details.page').then((m) => m.LeadDetailsPage),
      },
      {
        path: 'partnerships/follow-ups',
        loadComponent: () =>
          import('./features/partnerships/followups-list.page').then((m) => m.FollowUpsListPage),
      },
      {
        path: 'partnerships/activities',
        loadComponent: () =>
          import('./features/partnerships/activities-list.page').then((m) => m.ActivitiesListPage),
      },
      {
        path: 'partnerships/import',
        loadComponent: () =>
          import('./features/partnerships/import/import.page').then((m) => m.ImportPage),
      },
      {
        path: 'partnerships/import/history',
        loadComponent: () =>
          import('./features/partnerships/import/import-history.page').then(
            (m) => m.ImportHistoryPage,
          ),
      },
      {
        path: 'partnerships/import/history/:id',
        loadComponent: () =>
          import('./features/partnerships/import/import-history-detail.page').then(
            (m) => m.ImportHistoryDetailPage,
          ),
      },
      {
        path: 'partnerships/research',
        loadComponent: () =>
          import('./features/partnerships/research/research.page').then((m) => m.ResearchPage),
      },
      {
        path: 'partnerships/research/jobs/:id',
        loadComponent: () =>
          import('./features/partnerships/research/research-job.page').then((m) => m.ResearchJobPage),
      },
      {
        path: 'partnerships/research/candidates/:id',
        loadComponent: () =>
          import('./features/partnerships/research/research-candidate.page').then(
            (m) => m.ResearchCandidatePage,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
