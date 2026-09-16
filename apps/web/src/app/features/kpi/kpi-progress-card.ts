import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { StudentKpiDashboard } from './kpi.models';

@Component({
  selector: 'app-kpi-progress-card',
  imports: [RouterLink, MatButtonModule, MatProgressBarModule, TPipe],
  template: `
    @if (dashboard(); as current) {
      <section class="card">
        <header>
          <div>
            <p class="kicker">{{ 'kpis.progressKicker' | t }}</p>
            <h2>{{ current.overallPercent }}%</h2>
            <p>
              {{ 'kpis.countsLine' | t:{
                status: i18n.statusLabel(current.overallStatus),
                onTrack: current.onTrackCount,
                atRisk: current.atRiskCount,
                behind: current.behindCount
              } }}
            </p>
          </div>
          @if (linkToFull()) {
            <a mat-stroked-button [routerLink]="['/students', current.studentId, 'kpis']">
              {{ 'students.openKpis' | t }}
            </a>
          }
        </header>
        <mat-progress-bar mode="determinate" [value]="current.overallPercent" />
        <ul>
          @for (item of current.items; track item.id) {
            <li>
              <div class="meta">
                <strong>{{ item.kpi.name }}</strong>
                <span>{{ item.progressPercent }}% · {{ i18n.statusLabel(item.status) }}</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="item.progressPercent" />
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: `
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
export class KpiProgressCard {
  readonly i18n = inject(DirectionService);
  readonly dashboard = input.required<StudentKpiDashboard>();
  readonly linkToFull = input(false);
}
