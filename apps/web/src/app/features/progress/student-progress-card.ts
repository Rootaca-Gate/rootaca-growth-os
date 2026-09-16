import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmptyState } from '../../shared/empty-state';
import { formatGrowth } from './progress.labels';
import { ProgressApi } from './progress.api';
import { StudentProgressDashboard as ProgressDashboard } from './progress.models';

@Component({
  selector: 'app-student-progress-card',
  imports: [
    RouterLink,
    MatButtonModule,
    EmptyState,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="wrap">
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="28" /></div>
      } @else if (error(); as message) {
        <app-empty-state title="No progress history" [message]="message" />
      } @else if (dashboard(); as current) {
        <section class="card">
          <header>
            <div>
              <p class="kicker">Progress reviews</p>
              <h2>{{ current.currentScore }}</h2>
              <p>
                Current {{ current.currentScore }} · Previous {{ current.previousScore ?? '—' }} ·
                Growth {{ formatGrowth(current.growth) }}
              </p>
            </div>
            <a mat-stroked-button [routerLink]="['/students', current.studentId, 'progress']">
              Open progress
            </a>
          </header>
          <mat-progress-bar mode="determinate" [value]="current.currentScore" />
          @if (current.history.length === 0) {
            <p>No initial assessment or monthly review yet.</p>
          } @else {
            <ul>
              @for (item of current.dimensions; track item.key) {
                <li>
                  <div class="meta">
                    <strong>{{ item.label }}</strong>
                    <span>{{ item.currentScore }} · {{ formatGrowth(item.growth) }}</span>
                  </div>
                  <mat-progress-bar mode="determinate" [value]="item.currentScore" />
                </li>
              }
            </ul>
          }
        </section>
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

    .card {
      display: grid;
      gap: 16px;
      padding: 20px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container-low);
    }

    header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }

    .kicker {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
      color: var(--mat-sys-on-surface-variant);
    }

    h2,
    p {
      margin: 0;
    }

    h2 {
      font-size: 2rem;
    }

    p,
    span {
      color: var(--mat-sys-on-surface-variant);
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
    }

    .meta {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }
  `,
})
export class StudentProgressCard {
  private readonly api = inject(ProgressApi);
  readonly studentId = input.required<string>();
  readonly loading = signal(true);
  readonly dashboard = signal<ProgressDashboard | null>(null);
  readonly error = signal<string | null>(null);
  readonly formatGrowth = formatGrowth;

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
      return 'Student not found.';
    }
    return 'Unable to load progress history.';
  }
}
