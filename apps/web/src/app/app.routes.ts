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
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
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
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
