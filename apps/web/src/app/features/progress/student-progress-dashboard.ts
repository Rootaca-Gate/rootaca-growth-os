import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { EmptyState } from '../../shared/empty-state';
import { GrowthChartComponent } from './growth-chart';
import { MentorReviewForm } from './mentor-review-form';
import { formatGrowth, REVIEW_KIND_LABELS } from './progress.labels';
import { ProgressApi } from './progress.api';
import {
  ProgressReview,
  StudentProgressDashboard as ProgressDashboard,
  UpsertProgressReview,
} from './progress.models';

@Component({
  selector: 'app-student-progress-dashboard',
  imports: [EmptyState, MatProgressSpinnerModule, GrowthChartComponent, MentorReviewForm],
  template: `
    <div class="wrap">
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="28" /></div>
      } @else if (error(); as message) {
        <app-empty-state title="No progress history" [message]="message" />
      } @else if (dashboard(); as current) {
        <section class="summary">
          <div>
            <p class="kicker">Progress review</p>
            <h2>{{ current.currentScore }}</h2>
            <p>
              Current {{ current.currentScore }} · Previous {{ current.previousScore ?? '—' }} ·
              Growth {{ formatGrowth(current.growth) }}
            </p>
          </div>
          <ul>
            @for (item of current.dimensions; track item.key) {
              <li>
                <strong>{{ item.label }}</strong>
                <span>{{ item.currentScore }}</span>
                <em>{{ formatGrowth(item.growth) }}</em>
              </li>
            }
          </ul>
        </section>

        <div class="charts">
          <app-growth-chart [chart]="current.skillGrowth" />
          <app-growth-chart [chart]="current.kpiGrowth" />
          <app-growth-chart [chart]="current.projectGrowth" />
        </div>

        @if (canEdit()) {
          <app-mentor-review-form (saved)="create($event)" />
        }

        <section class="history">
          <h3>Progress history</h3>
          @if (current.history.length === 0) {
            <app-empty-state
              title="No reviews yet"
              message="Mentors can add an initial assessment, then monthly reviews."
            />
          } @else {
            <ol>
              @for (item of current.history; track item.id) {
                <li>
                  <header>
                    <div>
                      <p class="kicker">{{ kindLabel(item.kind) }}</p>
                      <h4>{{ item.reviewedAt }}</h4>
                      <p>{{ item.reviewer.displayName }}</p>
                    </div>
                    <dl>
                      <div>
                        <dt>Current</dt>
                        <dd>{{ item.overallScore }}</dd>
                      </div>
                      <div>
                        <dt>Previous</dt>
                        <dd>{{ item.previousOverallScore ?? '—' }}</dd>
                      </div>
                      <div>
                        <dt>Growth</dt>
                        <dd>{{ formatGrowth(item.overallGrowth) }}</dd>
                      </div>
                    </dl>
                  </header>
                  <ul>
                    @for (dimension of item.dimensions; track dimension.key) {
                      <li>
                        {{ dimension.label }}
                        <span
                          >{{ dimension.currentScore }} · {{ formatGrowth(dimension.growth) }}</span
                        >
                      </li>
                    }
                  </ul>
                  @if (item.strengths) {
                    <p>Strengths. {{ item.strengths }}</p>
                  }
                  @if (item.nextFocus) {
                    <p>Next focus. {{ item.nextFocus }}</p>
                  }
                  @if (item.notes) {
                    <p>{{ item.notes }}</p>
                  }
                </li>
              }
            </ol>
          }
        </section>
      }
    </div>
  `,
  styles: `
    .wrap {
      padding: 8px 0 0;
      display: grid;
      gap: 16px;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 24px 0;
    }

    .summary,
    .history li {
      padding: 20px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container-low);
      display: grid;
      gap: 16px;
    }

    .kicker {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
      color: var(--mat-sys-on-surface-variant);
    }

    h2,
    h3,
    h4,
    p {
      margin: 0;
    }

    h2 {
      font-size: 2rem;
    }

    p,
    span,
    em {
      color: var(--mat-sys-on-surface-variant);
      font-style: normal;
    }

    .summary ul,
    .history ul,
    ol {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }

    .summary ul {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }

    .summary li,
    .history ul li {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: baseline;
    }

    .summary li {
      flex-direction: column;
      align-items: flex-start;
    }

    .charts {
      display: grid;
      gap: 16px;
    }

    @media (min-width: 1024px) {
      .charts {
        grid-template-columns: 1fr;
      }
    }

    header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }

    dl {
      display: grid;
      grid-template-columns: repeat(3, minmax(64px, 1fr));
      gap: 8px 16px;
      margin: 0;
    }

    dt {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    dd {
      margin: 0;
      font-weight: 600;
    }

    em[data-up] {
      color: var(--mat-sys-primary);
    }
  `,
})
export class StudentProgressDashboard {
  private readonly api = inject(ProgressApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly studentId = input.required<string>();
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<ProgressDashboard | null>(null);
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

  canEdit(): boolean {
    const role = this.auth.currentUser()?.role;
    return role === 'ADMIN' || role === 'MENTOR';
  }

  kindLabel(kind: ProgressReview['kind']): string {
    return REVIEW_KIND_LABELS[kind];
  }

  create(payload: UpsertProgressReview): void {
    this.api.create(this.studentId(), payload).subscribe({
      next: () => {
        this.snackBar.open('Progress review saved', 'OK', { duration: 2000 });
        this.reload();
      },
      error: (error: unknown) => {
        this.snackBar.open(this.toMessage(error), 'OK', { duration: 4000 });
      },
    });
  }

  private reload(): void {
    this.api.getDashboard(this.studentId()).subscribe({
      next: (dashboard) => this.dashboard.set(dashboard),
    });
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'Only mentors and admins can write progress reviews.';
      }
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }
    }
    return 'Unable to load progress reviews.';
  }
}
