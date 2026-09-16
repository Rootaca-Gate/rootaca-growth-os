import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { OrientationApi } from './orientation.api';
import { OrientationSessionSummary } from './orientation.models';

@Component({
  selector: 'app-orientation-hub-page',
  imports: [
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
      [title]="'orientation.title' | t"
      [subtitle]="'orientation.subtitle' | t"
    >
      <a mat-flat-button color="primary" routerLink="/students">{{ 'students.allStudents' | t }}</a>
    </app-page-header>

    @if (loading()) {
      <app-loading-skeleton [rows]="6" />
    } @else if (error(); as message) {
      <app-error-state [message]="message" (retry)="load()" />
    } @else {
      <div class="tabs">
        <button type="button" [class.active]="filter() === 'needs'" (click)="filter.set('needs')">
          {{ 'orientation.needs' | t }}
        </button>
        <button type="button" [class.active]="filter() === 'scheduled'" (click)="filter.set('scheduled')">
          {{ 'orientation.scheduled' | t }}
        </button>
        <button type="button" [class.active]="filter() === 'completed'" (click)="filter.set('completed')">
          {{ 'orientation.completed' | t }}
        </button>
      </div>

      @if (visible().length === 0) {
        <app-empty-state [title]="'orientation.emptyTitle' | t" [message]="'orientation.emptyMessage' | t">
          <a mat-stroked-button routerLink="/students">{{ 'students.allStudents' | t }}</a>
        </app-empty-state>
      } @else {
        <ul>
          @for (row of visible(); track row.student.id) {
            <li class="ra-card">
              <div>
                <strong>{{ row.student.fullName }}</strong>
                <p>{{ row.label | t }}</p>
              </div>
              <app-status-badge [tone]="row.status" />
              <a mat-button [routerLink]="row.href">{{ 'common.open' | t }}</a>
            </li>
          }
        </ul>
      }
    }
  `,
  styles: `
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-block-end: 16px;
    }
    .tabs button {
      border: 1px solid var(--ra-border);
      background: white;
      border-radius: 999px;
      padding: 8px 14px;
      cursor: pointer;
    }
    .tabs button.active {
      background: var(--ra-accent);
      color: white;
      border-color: var(--ra-accent);
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
    }
    li {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 12px;
      align-items: center;
      padding: 16px 18px;
    }
    @media (max-width: 640px) {
      li {
        grid-template-columns: 1fr;
      }
    }
    p {
      margin: 4px 0 0;
      color: var(--ra-muted);
    }
  `,
})
export class OrientationHubPage {
  private readonly studentsApi = inject(StudentsApi);
  private readonly orientationApi = inject(OrientationApi);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(DirectionService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filter = signal<'needs' | 'scheduled' | 'completed'>('needs');
  readonly rows = signal<
    Array<{ student: Student; status: string; label: string; href: string; group: string }>
  >([]);

  constructor() {
    if (this.route.snapshot.queryParamMap.get('status') === 'not_started') {
      this.filter.set('needs');
    }
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
        this.rows.set(this.buildRows(students.items, sessions));
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(httpErrorMessage(error, this.i18n.t('errors.connection')));
        this.loading.set(false);
      },
    });
  }

  visible() {
    return this.rows().filter((row) => row.group === this.filter());
  }

  private buildRows(students: Student[], sessions: OrientationSessionSummary[]) {
    const byStudent = new Map<string, OrientationSessionSummary[]>();
    for (const session of sessions) {
      const list = byStudent.get(session.studentId) ?? [];
      list.push(session);
      byStudent.set(session.studentId, list);
    }
    return students.map((student) => {
      const studentSessions = byStudent.get(student.id) ?? [];
      const completed = studentSessions.find((session) => session.status === 'COMPLETED');
      const scheduled = studentSessions.find((session) => session.status === 'DRAFT');
      const live = studentSessions.find(
        (session) => session.status === 'IN_PROGRESS' || session.status === 'PAUSED',
      );
      if (completed) {
        return {
          student,
          group: 'completed',
          status: 'COMPLETED',
          label: 'orientation.completedLabel',
          href: `/students/${student.id}/orientation/${completed.id}`,
        };
      }
      if (live) {
        return {
          student,
          group: 'scheduled',
          status: live.status,
          label: 'orientation.assessmentInProgress',
          href: `/students/${student.id}/orientation/${live.id}`,
        };
      }
      if (scheduled) {
        return {
          student,
          group: 'scheduled',
          status: 'DRAFT',
          label: 'orientation.scheduledLabel',
          href: `/students/${student.id}/orientation/${scheduled.id}`,
        };
      }
      return {
        student,
        group: 'needs',
        status: 'NOT_STARTED',
        label: 'orientation.notCompleted',
        href: `/students/${student.id}`,
      };
    });
  }
}
