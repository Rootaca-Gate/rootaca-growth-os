import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ProjectApi } from './project.api';
import { StudentProjectStatus, StudentProjectSummary } from './project.models';

@Component({
  selector: 'app-student-project-progress',
  imports: [RouterLink, MatButtonModule, EmptyState, MatProgressBarModule, MatProgressSpinnerModule, TPipe],
  template: `
    <div class="wrap">
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="28" /></div>
      } @else if (error(); as message) {
        <app-empty-state [title]="'projects.empty' | t" [message]="message" />
      } @else if (summary(); as current) {
        <section class="card">
          <header>
            <div>
              <p class="kicker">{{ 'projects.progressTitle' | t }}</p>
              <h2>{{ current.overallPercent }}%</h2>
              <p>
                {{ 'projects.classroomWorkOnly' | t:{
                  completed: current.completedCount,
                  inProgress: current.inProgressCount
                } }}
              </p>
            </div>
            <a mat-stroked-button [routerLink]="['/students', current.studentId, 'projects']">
              {{ 'projects.openProjects' | t }}
            </a>
          </header>
          <mat-progress-bar mode="determinate" [value]="current.overallPercent" />
          @if (current.items.length === 0) {
            <p>{{ 'projects.noAssignedYet' | t }}</p>
          } @else {
            <ul>
              @for (item of current.items; track item.id) {
                <li>
                  <div class="meta">
                    <strong>{{ item.project.name }}</strong>
                    <span>{{ item.progressPercent }}% · {{ i18n.statusLabel(item.status) }}</span>
                  </div>
                  <mat-progress-bar mode="determinate" [value]="item.progressPercent" />
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
export class StudentProjectProgress {
  private readonly api = inject(ProjectApi);
  readonly i18n = inject(DirectionService);
  readonly studentId = input.required<string>();
  readonly loading = signal(true);
  readonly summary = signal<StudentProjectSummary | null>(null);
  readonly error = signal<string | null>(null);

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

  statusLabel(status: StudentProjectStatus): string {
    return this.i18n.statusLabel(status);
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return this.i18n.t('students.notFound');
    }
    return this.i18n.t('projects.unableProgress');
  }
}
