import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { formatElapsed } from './orientation.labels';
import { OrientationSession } from './orientation.models';

@Component({
  selector: 'app-orientation-timer',
  imports: [MatButtonModule],
  template: `
    <section class="timer" [class.overtime]="overtime()">
      <div>
        <p class="label">{{ overtime() ? 'Overtime' : 'Session timer' }}</p>
        <p class="clock">{{ clock() }} / 20:00</p>
        <p class="hint">The timer never blocks completion.</p>
      </div>
      <div class="actions">
        @if (session().status === 'DRAFT') {
          <button mat-flat-button color="primary" type="button" (click)="started.emit()">
            Start
          </button>
        }
        @if (session().status === 'IN_PROGRESS') {
          <button mat-stroked-button type="button" (click)="paused.emit()">Pause</button>
        }
        @if (session().status === 'PAUSED') {
          <button mat-flat-button color="primary" type="button" (click)="resumed.emit()">
            Resume
          </button>
        }
      </div>
    </section>
  `,
  styles: `
    .timer {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      background: var(--mat-sys-surface-container-lowest);
    }

    .overtime {
      border-color: var(--mat-sys-error);
    }

    .label,
    .hint {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.8rem;
    }

    .clock {
      margin: 4px 0;
      font-size: 1.8rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `,
})
export class OrientationTimer {
  readonly session = input.required<OrientationSession>();
  readonly elapsedMs = input.required<number>();
  readonly started = output<void>();
  readonly paused = output<void>();
  readonly resumed = output<void>();

  readonly overtime = computed(() => this.elapsedMs() > this.session().targetDurationMs);
  readonly clock = computed(() => formatElapsed(this.elapsedMs()));
}
