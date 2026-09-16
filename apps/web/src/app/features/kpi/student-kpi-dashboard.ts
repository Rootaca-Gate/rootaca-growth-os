import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { EmptyState } from '../../shared/empty-state';
import { KpiApi } from './kpi.api';
import {
  KPI_CATEGORY_LABELS,
  KPI_FREQUENCY_LABELS,
  KPI_STATUS_LABELS,
} from './kpi.labels';
import { KpiStatus, StudentKpiDashboard as StudentKpiDashboardModel, StudentKpiItem } from './kpi.models';

@Component({
  selector: 'app-student-kpi-dashboard',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    EmptyState,
  ],
  template: `
    <div class="wrap">
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="28" /></div>
      } @else if (error(); as message) {
        <app-empty-state title="No KPIs yet" [message]="message" />
      } @else if (dashboard(); as current) {
        <section class="summary">
          <header>
            <div>
              <p class="kicker">KPI dashboard</p>
              <h2>{{ current.overallPercent }}%</h2>
              <p>{{ statusLabel(current.overallStatus) }} · weighted across active KPIs</p>
            </div>
            <ul class="counts">
              <li>On track {{ current.onTrackCount }}</li>
              <li>At risk {{ current.atRiskCount }}</li>
              <li>Behind {{ current.behindCount }}</li>
              <li>Completed {{ current.completedCount }}</li>
            </ul>
          </header>
          <mat-progress-bar mode="determinate" [value]="current.overallPercent" />
        </section>

        <div class="grid">
          @for (item of current.items; track item.id) {
            <article [attr.data-status]="item.status">
              <p class="kicker">
                {{ categoryLabel(item.kpi.category) }} · {{ frequencyLabel(item.kpi.frequency) }}
              </p>
              <h3>{{ item.kpi.name }}</h3>
              <p>{{ item.kpi.description }}</p>
              <dl>
                <div>
                  <dt>Target</dt>
                  <dd>{{ item.target }} {{ item.kpi.unit }}</dd>
                </div>
                <div>
                  <dt>Actual</dt>
                  <dd>{{ item.actual }} {{ item.kpi.unit }}</dd>
                </div>
                <div>
                  <dt>Progress</dt>
                  <dd>{{ item.progressPercent }}%</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{{ statusLabel(item.status) }}</dd>
                </div>
              </dl>
              <mat-progress-bar mode="determinate" [value]="item.progressPercent" />
              <p class="period">
                {{ item.current.periodStart }} → {{ item.current.periodEnd }}
                @if (item.weekly && item.monthly) {
                  · week {{ item.weekly.progressPercent }}% · month {{ item.monthly.progressPercent }}%
                }
              </p>
              @if (canEdit() && editingId() === item.id) {
                <form [formGroup]="recordForm" (ngSubmit)="save(item)">
                  <mat-form-field appearance="outline">
                    <mat-label>Actual</mat-label>
                    <input matInput type="number" formControlName="actual" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Target</mat-label>
                    <input matInput type="number" formControlName="target" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Notes</mat-label>
                    <textarea matInput rows="2" formControlName="notes"></textarea>
                  </mat-form-field>
                  <div class="actions">
                    <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
                      Save record
                    </button>
                    <button mat-button type="button" (click)="editingId.set(null)">Cancel</button>
                  </div>
                </form>
              } @else if (canEdit()) {
                <button mat-stroked-button type="button" (click)="edit(item)">Update actual</button>
              }
              @if (item.history.length) {
                <div class="history">
                  <h4>History</h4>
                  <ul>
                    @for (record of item.history; track record.id) {
                      <li>
                        <strong>{{ frequencyLabel(record.frequency) }} {{ record.periodStart }}</strong>
                        <span>
                          {{ record.actual }}/{{ record.target }} {{ item.kpi.unit }} ·
                          {{ record.progressPercent }}% · {{ statusLabel(record.status) }}
                        </span>
                      </li>
                    }
                  </ul>
                </div>
              }
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .wrap {
      padding: 8px 0 0;
      display: grid;
      gap: 20px;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 24px 0;
    }

    .summary,
    article {
      padding: 20px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container-low);
      display: grid;
      gap: 12px;
    }

    header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }

    .counts {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 4px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.9rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    article[data-status='BEHIND'] {
      outline: 1px solid color-mix(in srgb, var(--mat-sys-error) 40%, transparent);
    }

    article[data-status='AT_RISK'] {
      outline: 1px solid color-mix(in srgb, #c47b17 45%, transparent);
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
    .period,
    span {
      color: var(--mat-sys-on-surface-variant);
    }

    dl {
      display: grid;
      grid-template-columns: 1fr 1fr;
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

    form,
    .actions {
      display: grid;
      gap: 8px;
    }

    .history ul {
      list-style: none;
      margin: 8px 0 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
  `,
})
export class StudentKpiDashboard {
  private readonly api = inject(KpiApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly studentId = input.required<string>();
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<StudentKpiDashboardModel | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly canEdit = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'ADMIN' || role === 'MENTOR';
  });

  readonly recordForm = new FormGroup({
    actual: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    target: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    notes: new FormControl('', { nonNullable: true }),
  });

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

  statusLabel(status: KpiStatus): string {
    return KPI_STATUS_LABELS[status];
  }

  categoryLabel(category: StudentKpiItem['kpi']['category']): string {
    return KPI_CATEGORY_LABELS[category];
  }

  frequencyLabel(frequency: StudentKpiItem['kpi']['frequency']): string {
    return KPI_FREQUENCY_LABELS[frequency];
  }

  edit(item: StudentKpiItem): void {
    this.editingId.set(item.id);
    this.recordForm.reset({
      actual: item.actual,
      target: item.target,
      notes: item.current.notes,
    });
  }

  save(item: StudentKpiItem): void {
    this.saving.set(true);
    const value = this.recordForm.getRawValue();
    this.api
      .record(this.studentId(), item.id, {
        actual: Number(value.actual),
        target: Number(value.target),
        notes: value.notes,
      })
      .subscribe({
        next: (dashboard) => {
          this.dashboard.set(dashboard);
          this.saving.set(false);
          this.editingId.set(null);
          this.snackBar.open('KPI record saved', 'OK', { duration: 2000 });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.snackBar.open(this.toMessage(error), 'OK', { duration: 4000 });
        },
      });
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'Only mentors and admins can update KPI actuals.';
      }
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }
    }
    return 'Unable to load KPIs.';
  }
}
