import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { ProgressBar } from '../../shared/progress-bar';
import { httpErrorMessage } from '../../shared/http-error';
import { DashboardApi } from '../dashboard/dashboard.api';
import { DashboardStudentRow } from '../dashboard/dashboard.models';

@Component({
  selector: 'app-progress-hub-page',
  imports: [RouterLink, MatButtonModule, PageHeader, EmptyState, ErrorState, LoadingSkeleton, ProgressBar, TPipe],
  template: `
    <app-page-header [title]="'hubs.progressTitle' | t" [subtitle]="'hubs.progressSubtitle' | t" />
    @if (loading()) {
      <app-loading-skeleton [rows]="6" />
    } @else if (error(); as message) {
      <app-error-state [message]="message" (retry)="load()" />
    } @else if (students().every((row) => row.progress === null)) {
      <app-empty-state [title]="'hubs.noReviews' | t" [message]="'hubs.noReviewsHint' | t" />
    } @else {
      <ul>
        @for (row of students(); track row.studentId) {
          <li class="ra-card">
            <div>
              <strong>{{ row.studentName }}</strong>
              <p>{{ row.progress === null ? ('hubs.noReviewYet' | t) : row.progress + '%' }}</p>
            </div>
            @if (row.progress !== null) {
              <app-progress-bar [value]="row.progress" />
            }
            <a mat-button [routerLink]="['/students', row.studentId, 'progress']">{{ 'common.view' | t }}</a>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
    li { display: grid; grid-template-columns: 1fr 120px auto; gap: 12px; align-items: center; padding: 16px 18px; }
    p { margin: 4px 0 0; color: var(--ra-muted); }
    @media (max-width: 720px) {
      li { grid-template-columns: 1fr auto; }
    }
  `,
})
export class ProgressHubPage {
  private readonly api = inject(DashboardApi);
  readonly i18n = inject(DirectionService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly students = signal<DashboardStudentRow[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getDashboard().subscribe({
      next: (dashboard) => {
        this.students.set(dashboard.students);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(httpErrorMessage(error, this.i18n.t('errors.connection')));
        this.loading.set(false);
      },
    });
  }
}
