import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { KpiApi } from './kpi.api';
import { KpiProgressCard } from './kpi-progress-card';
import { StudentKpiDashboard } from './kpi.models';

@Component({
  selector: 'app-student-kpi-progress',
  imports: [EmptyState, KpiProgressCard, MatProgressSpinnerModule, TPipe],
  template: `
    <div class="wrap">
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="28" /></div>
      } @else if (error(); as message) {
        <app-empty-state [title]="'kpis.noKpisYet' | t" [message]="message" />
      } @else if (dashboard(); as current) {
        <app-kpi-progress-card [dashboard]="current" [linkToFull]="true" />
      }
    </div>
  `,
  styles: `
    .wrap {
      padding: 8px 0 0;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 24px 0;
    }
  `,
})
export class StudentKpiProgress {
  private readonly api = inject(KpiApi);
  readonly i18n = inject(DirectionService);
  readonly studentId = input.required<string>();
  readonly loading = signal(true);
  readonly dashboard = signal<StudentKpiDashboard | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const studentId = this.studentId();
      this.loading.set(true);
      this.api.getDashboard(studentId).subscribe({
        next: (dashboard) => {
          this.dashboard.set(dashboard);
          this.error.set(null);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.dashboard.set(null);
          this.error.set(this.toMessage(error));
          this.loading.set(false);
        },
      });
    });
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return this.i18n.t('students.notFound');
    }
    return this.i18n.t('kpis.unableProgress');
  }
}
