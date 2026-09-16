import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { OrientationApi } from './orientation.api';
import { formatElapsed, STAGE_META } from './orientation.labels';
import { OrientationSessionSummary } from './orientation.models';

@Component({
  selector: 'app-student-assessment-panel',
  imports: [MatButtonModule, EmptyState, TPipe],
  template: `
    <section class="panel">
      <header>
        <div>
          <h2>{{ 'orientation.twentyMin' | t }}</h2>
          <p>{{ 'orientation.help' | t }}</p>
        </div>
        <button
          mat-flat-button
          color="primary"
          type="button"
          [disabled]="starting()"
          (click)="start()"
        >
          {{ openSession() ? ('students.continueOrientation' | t) : ('students.startOrientation' | t) }}
        </button>
      </header>

      @if (sessions().length === 0) {
        <app-empty-state
          [title]="'orientation.noYet' | t"
          [message]="'orientation.noHint' | t"
        />
      } @else {
        <ul>
          @for (session of sessions(); track session.id) {
            <li>
              <div>
                <strong>{{ i18n.statusLabel(session.status) }}</strong>
                <span>{{ stageLabel(session) }} · {{ formatElapsed(session.elapsedMs) }}</span>
                @if (session.overallScore !== null && session.overallScore !== undefined) {
                  <span>{{ 'orientation.overallOutOf' | t:{ score: session.overallScore } }}</span>
                }
              </div>
              <button mat-button type="button" (click)="open(session.id)">{{ 'common.open' | t }}</button>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .panel {
      padding: 24px 8px 8px;
    }

    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    h2,
    p {
      margin: 0;
    }

    p {
      margin-top: 6px;
      color: var(--mat-sys-on-surface-variant);
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 8px;
    }

    li {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
    }

    span {
      display: block;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.85rem;
    }
  `,
})
export class StudentAssessmentPanel {
  private readonly orientationApi = inject(OrientationApi);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);

  readonly studentId = input.required<string>();
  readonly sessions = input.required<OrientationSessionSummary[]>();
  readonly starting = signal(false);

  readonly formatElapsed = formatElapsed;

  openSession(): OrientationSessionSummary | undefined {
    return this.sessions().find((session) => session.status !== 'COMPLETED');
  }

  stageLabel(session: OrientationSessionSummary): string {
    return `${STAGE_META[session.currentStage].window} ${this.i18n.stageLabel(session.currentStage)}`;
  }

  start(): void {
    const existing = this.openSession();
    if (existing) {
      this.open(existing.id);
      return;
    }

    this.starting.set(true);
    this.orientationApi.create(this.studentId()).subscribe({
      next: (session) => {
        void this.router.navigate(['/students', this.studentId(), 'orientation', session.id]);
      },
      error: () => {
        this.starting.set(false);
        this.snackBar.open(this.i18n.t('students.orientationFailed'), this.i18n.t('common.ok'), {
          duration: 3000,
        });
      },
    });
  }

  open(sessionId: string): void {
    void this.router.navigate(['/students', this.studentId(), 'orientation', sessionId]);
  }
}
