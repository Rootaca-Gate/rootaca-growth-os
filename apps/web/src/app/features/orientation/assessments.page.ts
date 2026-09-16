import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin } from 'rxjs';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { StatusBadge } from '../../shared/status-badge';
import { httpErrorMessage } from '../../shared/http-error';
import { StudentsApi } from '../students/students.api';
import { Student } from '../students/student.models';
import { OrientationApi } from '../orientation/orientation.api';
import { OrientationSessionSummary } from '../orientation/orientation.models';

@Component({
  selector: 'app-assessments-page',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    PageHeader,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    StatusBadge,
    TPipe,
  ],
  template: `
    <app-page-header
      [title]="'orientation.assessmentsTitle' | t"
      [subtitle]="'orientation.assessmentsSubtitle' | t"
    />
    @if (loading()) {
      <app-loading-skeleton [rows]="6" />
    } @else if (error(); as message) {
      <app-error-state [message]="message" (retry)="load()" />
    } @else if (rows().length === 0) {
      <app-empty-state [title]="'orientation.noAssessments' | t" [message]="'orientation.noAssessmentsHint' | t">
        <a mat-stroked-button routerLink="/orientation">{{ 'orientation.openOrientation' | t }}</a>
      </app-empty-state>
    } @else {
      <div class="ra-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ 'common.student' | t }}</th>
              <th>{{ 'common.date' | t }}</th>
              <th>{{ 'orientation.score' | t }}</th>
              <th>{{ 'common.status' | t }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.session.id) {
              <tr>
                <td>{{ row.studentName }}</td>
                <td>{{ (row.session.completedAt || row.session.createdAt) | date: 'mediumDate' : undefined : i18n.locale() }}</td>
                <td>{{ row.session.overallScore ?? '—' }}</td>
                <td><app-status-badge [tone]="row.session.status" /></td>
                <td><a mat-button [routerLink]="row.href">{{ 'common.view' | t }}</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 14px; text-align: start; border-bottom: 1px solid var(--ra-border); }
  `,
})
export class AssessmentsPage {
  private readonly studentsApi = inject(StudentsApi);
  private readonly orientationApi = inject(OrientationApi);
  readonly i18n = inject(DirectionService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rows = signal<
    Array<{ session: OrientationSessionSummary; studentName: string; href: string }>
  >([]);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      students: this.studentsApi.list({ page: 1, pageSize: 100 }),
      sessions: this.orientationApi.list(),
    }).subscribe({
      next: ({ students, sessions }) => {
        const names = new Map(students.items.map((student: Student) => [student.id, student.fullName]));
        const pending = sessions.filter(
          (session) => session.status === 'IN_PROGRESS' || session.status === 'PAUSED',
        );
        const completed = sessions.filter((session) => session.status === 'COMPLETED');
        this.rows.set(
          [...pending, ...completed].map((session) => ({
            session,
            studentName: names.get(session.studentId) ?? this.i18n.t('common.student'),
            href: `/students/${session.studentId}/orientation/${session.id}`,
          })),
        );
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(httpErrorMessage(error, this.i18n.t('errors.connection')));
        this.loading.set(false);
      },
    });
  }
}
