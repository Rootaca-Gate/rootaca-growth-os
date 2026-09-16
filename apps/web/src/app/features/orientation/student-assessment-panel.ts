import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmptyState } from '../../shared/empty-state';
import { OrientationApi } from './orientation.api';
import { formatElapsed, SESSION_STATUS_LABELS, STAGE_META } from './orientation.labels';
import { OrientationSessionSummary } from './orientation.models';

@Component({
  selector: 'app-student-assessment-panel',
  imports: [MatButtonModule, EmptyState],
  template: `
    <section class="panel">
      <header>
        <div>
          <h2>20-minute orientation</h2>
          <p>Run the ROOTACA assessment. Completing it calculates level, skills, and a path recommendation.</p>
        </div>
        <button
          mat-flat-button
          color="primary"
          type="button"
          [disabled]="starting()"
          (click)="start()"
        >
          {{ openSession() ? 'Continue orientation' : 'Start orientation' }}
        </button>
      </header>

      @if (sessions().length === 0) {
        <app-empty-state
          title="No orientation yet"
          message="Start a 20-minute session to capture profile, technical, problem-solving, and path notes."
        />
      } @else {
        <ul>
          @for (session of sessions(); track session.id) {
            <li>
              <div>
                <strong>{{ statusLabel(session.status) }}</strong>
                <span>{{ stageLabel(session) }} · {{ formatElapsed(session.elapsedMs) }}</span>
                @if (session.overallScore !== null && session.overallScore !== undefined) {
                  <span>Overall {{ session.overallScore }}/100</span>
                }
              </div>
              <button mat-button type="button" (click)="open(session.id)">Open</button>
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

  readonly studentId = input.required<string>();
  readonly sessions = input.required<OrientationSessionSummary[]>();
  readonly starting = signal(false);

  readonly formatElapsed = formatElapsed;

  openSession(): OrientationSessionSummary | undefined {
    return this.sessions().find((session) => session.status !== 'COMPLETED');
  }

  statusLabel(status: OrientationSessionSummary['status']): string {
    return SESSION_STATUS_LABELS[status];
  }

  stageLabel(session: OrientationSessionSummary): string {
    return `${STAGE_META[session.currentStage].window} ${STAGE_META[session.currentStage].label}`;
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
        this.snackBar.open('Unable to start orientation', 'OK', { duration: 3000 });
      },
    });
  }

  open(sessionId: string): void {
    void this.router.navigate(['/students', this.studentId(), 'orientation', sessionId]);
  }
}
