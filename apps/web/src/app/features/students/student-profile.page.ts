import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { StudentKpiDashboard } from '../kpi/student-kpi-dashboard';
import { StudentProjectBoard } from '../projects/student-project-board';
import { StudentProgressDashboard } from '../progress/student-progress-dashboard';
import { StudentReportPreview } from '../reports/student-report-preview';
import { StudentRoadmapPanel } from '../placement/student-roadmap-panel';
import { StudentSkillsPanel } from '../placement/student-skills-panel';
import { StudentRoadmapProgress } from '../roadmap/student-roadmap-progress';
import { OrientationApi } from '../orientation/orientation.api';
import { OrientationSessionSummary } from '../orientation/orientation.models';
import { StudentAssessmentPanel } from '../orientation/student-assessment-panel';
import { StudentOverview } from './student-overview';
import { STUDENT_STATUSES } from './student.labels';
import { Student, StudentStatus } from './student.models';
import { StudentsApi } from './students.api';
import { ProgressApi } from '../progress/progress.api';
import { ProgressReview, StudentProgressDashboard as StudentProgressDashboardModel } from '../progress/progress.models';
import { Timeline } from '../../shared/timeline';

@Component({
  selector: 'app-student-profile-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    PageHeader,
    ErrorState,
    LoadingSkeleton,
    StudentOverview,
    StudentAssessmentPanel,
    StudentSkillsPanel,
    StudentRoadmapPanel,
    StudentRoadmapProgress,
    StudentKpiDashboard,
    StudentProjectBoard,
    StudentProgressDashboard,
    StudentReportPreview,
    Timeline,
    TPipe,
  ],
  templateUrl: './student-profile.page.html',
  styleUrl: './student-profile.page.scss',
})
export class StudentProfilePage {
  private readonly studentsApi = inject(StudentsApi);
  private readonly orientationApi = inject(OrientationApi);
  private readonly progressApi = inject(ProgressApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly student = signal<Student | null>(null);
  readonly sessions = signal<OrientationSessionSummary[]>([]);
  readonly reviews = signal<ProgressReview[]>([]);
  readonly progress = signal<StudentProgressDashboardModel | null>(null);
  readonly statuses = STUDENT_STATUSES;
  readonly statusControl = new FormControl<StudentStatus>('INTAKE', { nonNullable: true });

  readonly nextAction = computed(() => {
    this.i18n.locale();
    const student = this.student();
    if (!student) {
      return null;
    }
    const sessions = this.sessions();
    const completed = sessions.some((session) => session.status === 'COMPLETED');
    const inProgress = sessions.find(
      (session) => session.status === 'IN_PROGRESS' || session.status === 'PAUSED',
    );
    const draft = sessions.find((session) => session.status === 'DRAFT');
    if (!completed && inProgress) {
      return {
        title: this.i18n.t('students.completeAssessment'),
        detail: this.i18n.t('students.completeAssessmentDetail'),
        label: this.i18n.t('students.continueAssessment'),
        href: `/students/${student.id}/orientation/${inProgress.id}`,
      };
    }
    if (!completed) {
      return {
        title: this.i18n.t('students.completeOrientation'),
        detail: this.i18n.t('students.completeOrientationDetail'),
        label: draft ? this.i18n.t('students.continueOrientation') : this.i18n.t('students.startOrientation'),
        href: draft
          ? `/students/${student.id}/orientation/${draft.id}`
          : `/students/${student.id}`,
        start: !draft,
      };
    }
    return {
      title: this.i18n.t('students.reviewKpi'),
      detail: this.i18n.t('students.reviewKpiDetail'),
      label: this.i18n.t('students.openKpis'),
      href: `/students/${student.id}/kpis`,
    };
  });

  readonly notes = computed(() =>
    this.reviews()
      .filter((review) => review.notes.trim().length > 0)
      .map((review) => ({
        title: `${review.reviewer.displayName}: ${review.notes}`,
        occurredAt: review.reviewedAt,
      })),
  );

  activityItems(studentId: string) {
    return this.reviews().map((review) => ({
      title: this.i18n.t('activity.progressReviewed'),
      occurredAt: review.reviewedAt,
      href: `/students/${studentId}/progress`,
    }));
  }

  constructor() {
    this.reload();
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      student: this.studentsApi.get(id),
      sessions: this.orientationApi.list(id),
      progress: this.progressApi.getDashboard(id),
    }).subscribe({
      next: ({ student, sessions, progress }) => {
        this.student.set(student);
        this.sessions.set(sessions);
        this.reviews.set(progress.history);
        this.progress.set(progress);
        this.statusControl.setValue(student.status, { emitEvent: false });
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(this.toErrorMessage(error));
      },
    });
  }

  startOrientation(): void {
    const student = this.student();
    if (!student) {
      return;
    }
    this.orientationApi.create(student.id).subscribe({
      next: (session) => {
        void this.router.navigate(['/students', student.id, 'orientation', session.id]);
      },
      error: () =>
        this.snackBar.open(this.i18n.t('students.orientationFailed'), this.i18n.t('common.ok'), {
          duration: 3000,
        }),
    });
  }

  changeStatus(status: StudentStatus): void {
    const current = this.student();
    if (!current || current.status === status) {
      return;
    }
    this.studentsApi.updateStatus(current.id, status).subscribe({
      next: (student) => {
        this.student.set(student);
        this.snackBar.open(this.i18n.t('students.statusUpdated'), this.i18n.t('common.ok'), { duration: 2000 });
      },
      error: () => {
        this.statusControl.setValue(current.status, { emitEvent: false });
        this.snackBar.open(this.i18n.t('students.statusUpdateFailed'), this.i18n.t('common.ok'), { duration: 3000 });
      },
    });
  }

  meta(student: Student): string {
    this.i18n.locale();
    const level = student.currentLevel?.name
      ? this.i18n.namedLevel(student.currentLevel.name)
      : this.i18n.levelLabel(student.level);
    const path = student.currentPath?.name
      ? this.i18n.namedPath(student.currentPath.name)
      : this.i18n.pathLabel(student.path);
    return `${level} · ${path} · ${this.i18n.statusLabel(student.status)}`;
  }

  overallProgress(): string {
    const latest = this.progress()?.latest;
    if (!latest) {
      return '—';
    }
    return `${latest.overallScore}%`;
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return this.i18n.t('students.notFound');
    }
    return this.i18n.t('errors.connection');
  }
}
