import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin } from 'rxjs';
import { ComingSoonPanel } from '../../shared/coming-soon-panel';
import { PageHeader } from '../../shared/page-header';
import { StudentKpiDashboard } from '../kpi/student-kpi-dashboard';
import { StudentKpiProgress } from '../kpi/student-kpi-progress';
import { StudentProjectBoard } from '../projects/student-project-board';
import { StudentProjectProgress } from '../projects/student-project-progress';
import { StudentProgressCard } from '../progress/student-progress-card';
import { StudentProgressDashboard } from '../progress/student-progress-dashboard';
import { StudentReportPreview } from '../reports/student-report-preview';
import { StudentRoadmapPanel } from '../placement/student-roadmap-panel';
import { StudentRoadmapProgress } from '../roadmap/student-roadmap-progress';
import { StudentSkillsPanel } from '../placement/student-skills-panel';
import { OrientationApi } from '../orientation/orientation.api';
import { OrientationSessionSummary } from '../orientation/orientation.models';
import { StudentAssessmentPanel } from '../orientation/student-assessment-panel';
import { StudentOverview } from './student-overview';
import { STATUS_LABELS, STUDENT_STATUSES } from './student.labels';
import { Student, StudentStatus } from './student.models';
import { StudentsApi } from './students.api';

@Component({
  selector: 'app-student-profile-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    PageHeader,
    StudentOverview,
    ComingSoonPanel,
    StudentAssessmentPanel,
    StudentSkillsPanel,
    StudentRoadmapPanel,
    StudentRoadmapProgress,
    StudentKpiDashboard,
    StudentKpiProgress,
    StudentProjectBoard,
    StudentProjectProgress,
    StudentProgressCard,
    StudentProgressDashboard,
    StudentReportPreview,
  ],
  templateUrl: './student-profile.page.html',
  styleUrl: './student-profile.page.scss',
})
export class StudentProfilePage {
  private readonly studentsApi = inject(StudentsApi);
  private readonly orientationApi = inject(OrientationApi);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly student = signal<Student | null>(null);
  readonly sessions = signal<OrientationSessionSummary[]>([]);
  readonly statuses = STUDENT_STATUSES;
  readonly statusLabels = STATUS_LABELS;
  readonly statusControl = new FormControl<StudentStatus>('INTAKE', { nonNullable: true });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    forkJoin({
      student: this.studentsApi.get(id),
      sessions: this.orientationApi.list(id),
    }).subscribe({
      next: ({ student, sessions }) => {
        this.student.set(student);
        this.sessions.set(sessions);
        this.statusControl.setValue(student.status, { emitEvent: false });
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.snackBar.open(this.toErrorMessage(error), 'OK', { duration: 4000 });
      },
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
        this.snackBar.open('Status updated', 'OK', { duration: 2000 });
      },
      error: () => {
        this.statusControl.setValue(current.status, { emitEvent: false });
        this.snackBar.open('Unable to update status', 'OK', { duration: 3000 });
      },
    });
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return 'Student not found.';
    }
    return 'Unable to load student.';
  }
}
