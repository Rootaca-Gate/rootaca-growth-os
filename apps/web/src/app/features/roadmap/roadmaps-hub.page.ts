import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { httpErrorMessage } from '../../shared/http-error';
import { DashboardApi } from '../dashboard/dashboard.api';
import { DashboardStudentRow } from '../dashboard/dashboard.models';

@Component({
  selector: 'app-roadmaps-hub-page',
  imports: [RouterLink, MatButtonModule, PageHeader, ErrorState, LoadingSkeleton, TPipe],
  template: `
    <app-page-header [title]="'hubs.roadmapsTitle' | t" [subtitle]="'hubs.roadmapsSubtitle' | t" />
    @if (loading()) {
      <app-loading-skeleton [rows]="6" />
    } @else if (error(); as message) {
      <app-error-state [message]="message" (retry)="load()" />
    } @else if (overdueOnly() && overdue().length === 0) {
      <p class="quiet">{{ 'dashboard.allOnSchedule' | t }}</p>
    } @else {
      <ul>
        @for (row of visible(); track row.studentId) {
          <li class="ra-card">
            <div>
              <strong>{{ row.studentName }}</strong>
              <p>{{ i18n.namedLevel(row.level) }} · {{ i18n.namedPath(row.path) }}</p>
            </div>
            <a mat-stroked-button [routerLink]="['/students', row.studentId, 'roadmap']">{{ 'dashboard.viewRoadmap' | t }}</a>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
    li { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 16px 18px; }
    p, .quiet { color: var(--ra-muted); }
  `,
})
export class RoadmapsHubPage {
  private readonly api = inject(DashboardApi);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(DirectionService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly students = signal<DashboardStudentRow[]>([]);
  readonly overdueIds = signal<Set<string>>(new Set());
  readonly overdueOnly = signal(false);

  constructor() {
    this.overdueOnly.set(this.route.snapshot.queryParamMap.get('status') === 'overdue');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getDashboard().subscribe({
      next: (dashboard) => {
        this.students.set(dashboard.students);
        this.overdueIds.set(new Set(dashboard.attention.roadmapOverdue.map((item) => item.studentId)));
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(httpErrorMessage(error, this.i18n.t('errors.connection')));
        this.loading.set(false);
      },
    });
  }

  overdue() {
    return this.students().filter((row) => this.overdueIds().has(row.studentId));
  }

  visible() {
    return this.overdueOnly() ? this.overdue() : this.students();
  }
}
