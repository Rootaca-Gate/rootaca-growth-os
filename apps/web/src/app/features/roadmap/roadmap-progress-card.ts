import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { StudentRoadmap } from './roadmap.models';

@Component({
  selector: 'app-roadmap-progress-card',
  imports: [RouterLink, MatButtonModule, MatProgressBarModule, TPipe],
  template: `
    @if (roadmap(); as current) {
      <section class="card">
        <header>
          <div>
            <p class="kicker">{{ 'hubs.roadmapProgress' | t }}</p>
            <h2>{{ current.progress.overallPercent }}%</h2>
            <p>
              {{ current.pathName }} · {{ current.levelName }} ·
              {{ 'hubs.itemsCount' | t:{ completed: current.progress.completedCount, total: current.progress.itemCount } }}
            </p>
          </div>
          @if (linkToFull()) {
            <a mat-stroked-button [routerLink]="['/students', current.studentId, 'roadmap']">
              {{ 'hubs.openRoadmap' | t }}
            </a>
          }
        </header>
        <mat-progress-bar mode="determinate" [value]="current.progress.overallPercent" />
        <ul class="phases">
          @for (phase of current.progress.phases; track phase.phaseId) {
            <li>
              <div class="meta">
                <strong>{{ phase.title }}</strong>
                <span>{{ phase.percent }}%</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="phase.percent" />
            </li>
          }
        </ul>
        @if (current.progress.blockedItems.length) {
          <div class="blocked">
            <h3>{{ 'hubs.blockedItems' | t }}</h3>
            <ul>
              @for (item of current.progress.blockedItems; track item.id) {
                <li>
                  <strong>{{ item.title }}</strong>
                  <span>{{ i18n.statusLabel(item.status) }}{{ item.notes ? ' · ' + item.notes : '' }}</span>
                </li>
              }
            </ul>
          </div>
        }
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
    h3,
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

    .phases,
    .blocked ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
    }

    .meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .blocked {
      padding-top: 4px;
    }
  `,
})
export class RoadmapProgressCard {
  readonly i18n = inject(DirectionService);
  readonly roadmap = input.required<StudentRoadmap>();
  readonly linkToFull = input(false);
}
