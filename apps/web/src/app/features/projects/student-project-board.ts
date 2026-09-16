import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { MILESTONE_STATUSES } from './project.labels';
import { ProjectApi } from './project.api';
import {
  MilestoneStatus,
  ProjectMilestone,
  StudentProject,
  StudentProjectSummary,
} from './project.models';

@Component({
  selector: 'app-student-project-board',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    EmptyState,
    TPipe,
  ],
  template: `
    <div class="wrap">
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="28" /></div>
      } @else if (error(); as message) {
        <app-empty-state [title]="'projects.empty' | t" [message]="message" />
      } @else if (summary(); as current) {
        <section class="summary">
          <header>
            <div>
              <p class="kicker">{{ 'projects.progressTitle' | t }}</p>
              <h2>{{ current.overallPercent }}%</h2>
              <p>{{ 'projects.classroomNotClient' | t }}</p>
            </div>
            <ul>
              <li>{{ 'projects.assignedCount' | t:{ count: current.assignedCount } }}</li>
              <li>{{ 'projects.inProgressCount' | t:{ count: current.inProgressCount } }}</li>
              <li>{{ 'projects.completedCount' | t:{ count: current.completedCount } }}</li>
            </ul>
          </header>
          <mat-progress-bar mode="determinate" [value]="current.overallPercent" />
        </section>

        @if (current.items.length === 0) {
          <app-empty-state
            [title]="'projects.noAssigned' | t"
            [message]="'projects.assignHint' | t"
          />
        }

        @for (item of current.items; track item.id) {
          <article>
            <header>
              <div>
                <p class="kicker">{{ i18n.statusLabel(item.status) }}</p>
                <h3>{{ item.project.name }}</h3>
                <p>{{ item.project.learningGoal }}</p>
              </div>
              <a mat-stroked-button [routerLink]="['/projects', item.project.id]">{{ 'projects.projectLink' | t }}</a>
            </header>
            <dl>
              <div>
                <dt>{{ 'common.overall' | t }}</dt>
                <dd>{{ item.progressPercent }}%</dd>
              </div>
              <div>
                <dt>{{ 'common.due' | t }}</dt>
                <dd>{{ item.dueDate || '—' }}</dd>
              </div>
            </dl>
            <mat-progress-bar mode="determinate" [value]="item.progressPercent" />

            <ol>
              @for (milestone of item.milestones; track milestone.id) {
                <li [attr.data-status]="milestone.status">
                  <div class="meta">
                    <strong>{{ milestone.title }}</strong>
                    <span>{{ milestone.completionPercent }}% · {{ i18n.statusLabel(milestone.status) }}</span>
                  </div>
                  <p>{{ milestone.description }}</p>
                  <mat-progress-bar mode="determinate" [value]="milestone.completionPercent" />
                  <p class="due">{{ 'projects.dueOn' | t:{ date: milestone.dueDate || '—' } }}</p>
                  @if (milestone.mentorFeedback) {
                    <p class="feedback">{{ 'projects.mentorFeedback' | t }}: {{ milestone.mentorFeedback }}</p>
                  }
                  @if (canEdit() && editingId() === milestone.id) {
                    <form [formGroup]="form" (ngSubmit)="save(item, milestone)">
                      <mat-form-field appearance="outline">
                        <mat-label>{{ 'projects.completion' | t }}</mat-label>
                        <input matInput type="number" formControlName="completionPercent" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>{{ 'common.status' | t }}</mat-label>
                        <mat-select formControlName="status">
                          @for (status of statuses; track status) {
                            <mat-option [value]="status">{{ i18n.statusLabel(status) }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>{{ 'projects.dueDate' | t }}</mat-label>
                        <input matInput type="date" formControlName="dueDate" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>{{ 'projects.mentorFeedback' | t }}</mat-label>
                        <textarea matInput rows="2" formControlName="mentorFeedback"></textarea>
                      </mat-form-field>
                      <div class="actions">
                        <button mat-flat-button color="primary" type="submit" [disabled]="saving()">{{ 'common.save' | t }}</button>
                        <button mat-button type="button" (click)="editingId.set(null)">{{ 'common.cancel' | t }}</button>
                      </div>
                    </form>
                  } @else if (canEdit()) {
                    <button mat-stroked-button type="button" (click)="edit(milestone)">{{ 'projects.updateMilestone' | t }}</button>
                  }
                </li>
              }
            </ol>
          </article>
        }
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
    article,
    li {
      padding: 20px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container-low);
      display: grid;
      gap: 12px;
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
    h3,
    p {
      margin: 0;
    }

    h2 {
      font-size: 2rem;
    }

    p,
    span,
    .due,
    .feedback {
      color: var(--mat-sys-on-surface-variant);
    }

    ul,
    ol {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
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

    .meta {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    li[data-status='BLOCKED'] {
      outline: 1px solid color-mix(in srgb, var(--mat-sys-error) 40%, transparent);
    }

    form,
    .actions {
      display: grid;
      gap: 8px;
    }
  `,
})
export class StudentProjectBoard {
  private readonly api = inject(ProjectApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);
  readonly i18n = inject(DirectionService);

  readonly studentId = input.required<string>();
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly summary = signal<StudentProjectSummary | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly statuses = MILESTONE_STATUSES;
  readonly canEdit = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'ADMIN' || role === 'MENTOR';
  });

  readonly form = new FormGroup({
    completionPercent: new FormControl(0, { nonNullable: true }),
    status: new FormControl<MilestoneStatus>('NOT_STARTED', { nonNullable: true }),
    dueDate: new FormControl('', { nonNullable: true }),
    mentorFeedback: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const studentId = this.studentId();
      this.loading.set(true);
      this.api.listForStudent(studentId).subscribe({
        next: (summary) => {
          this.summary.set(summary);
          this.error.set(null);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.summary.set(null);
          this.error.set(this.toMessage(error));
          this.loading.set(false);
        },
      });
    });
  }

  statusLabel(status: StudentProject['status']): string {
    return this.i18n.statusLabel(status);
  }

  milestoneStatus(status: MilestoneStatus): string {
    return this.i18n.statusLabel(status);
  }

  edit(milestone: ProjectMilestone): void {
    this.editingId.set(milestone.id);
    this.form.reset({
      completionPercent: milestone.completionPercent,
      status: milestone.status,
      dueDate: milestone.dueDate ?? '',
      mentorFeedback: milestone.mentorFeedback,
    });
  }

  save(item: StudentProject, milestone: ProjectMilestone): void {
    this.saving.set(true);
    const value = this.form.getRawValue();
    this.api
      .updateMilestone(this.studentId(), item.id, milestone.id, {
        completionPercent: Number(value.completionPercent),
        status: value.status,
        dueDate: value.dueDate || null,
        mentorFeedback: value.mentorFeedback,
      })
      .subscribe({
        next: (updated) => {
          const current = this.summary();
          if (current) {
            this.summary.set({
              ...current,
              items: current.items.map((entry) => (entry.id === updated.id ? updated : entry)),
              overallPercent: Math.round(
                current.items
                  .map((entry) => (entry.id === updated.id ? updated.progressPercent : entry.progressPercent))
                  .reduce((sum, value) => sum + value, 0) / Math.max(1, current.items.length),
              ),
            });
          }
          this.saving.set(false);
          this.editingId.set(null);
          this.snackBar.open(this.i18n.t('projects.milestoneUpdated'), this.i18n.t('common.ok'), { duration: 2000 });
          this.reload();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.snackBar.open(this.toMessage(error), this.i18n.t('common.ok'), { duration: 4000 });
        },
      });
  }

  private reload(): void {
    this.api.listForStudent(this.studentId()).subscribe({
      next: (summary) => this.summary.set(summary),
    });
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return this.i18n.t('projects.noAccess');
      }
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }
    }
    return this.i18n.t('projects.unableStudent');
  }
}
