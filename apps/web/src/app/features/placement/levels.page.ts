import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { PageHeader } from '../../shared/page-header';
import { httpErrorMessage } from '../../shared/http-error';
import { DashboardApi } from '../dashboard/dashboard.api';
import { DashboardChartBucket } from '../dashboard/dashboard.models';
import { PlacementApi } from './placement.api';
import { Level } from './placement.models';

@Component({
  selector: 'app-levels-page',
  imports: [MatProgressSpinnerModule, PageHeader, EmptyState, ErrorState, TPipe],
  template: `
    <app-page-header
      [title]="'catalogs.levelsTitle' | t"
      [subtitle]="'catalogs.levelsSubtitle' | t"
    />

    @if (loading()) {
      <div class="loading"><mat-spinner diameter="36" /></div>
    } @else if (error(); as message) {
      <app-error-state [title]="'catalogs.levelsError' | t" [message]="message" (retry)="load()" />
    } @else if (levels().length === 0) {
      <app-empty-state [title]="'catalogs.noLevels' | t" [message]="'catalogs.noLevelsHint' | t" />
    } @else {
      <div class="grid">
        @for (level of levels(); track level.id) {
          <article>
            <p class="kicker">{{ band(level) }}</p>
            <h2>{{ level.name }}</h2>
            <p>{{ level.description }}</p>
            <p class="meta">{{ 'catalogs.studentsCount' | t:{ count: studentCount(level) } }}</p>
          </article>
        }
      </div>
    }
  `,
  styles: `
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    article {
      padding: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      background: var(--mat-sys-surface-container-lowest);
    }

    .kicker {
      margin: 0 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
      color: var(--mat-sys-on-surface-variant);
    }

    h2 {
      margin: 0 0 8px;
      font-size: 1.25rem;
    }

    p {
      margin: 0;
      line-height: 1.55;
      color: var(--mat-sys-on-surface-variant);
    }

    .meta {
      margin-top: 14px;
      font-weight: 600;
      color: var(--ra-text);
    }
  `,
})
export class LevelsPage {
  private readonly api = inject(PlacementApi);
  private readonly dashboardApi = inject(DashboardApi);
  readonly i18n = inject(DirectionService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly levels = signal<Level[]>([]);
  readonly counts = signal<DashboardChartBucket[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      levels: this.api.listLevels(),
      dashboard: this.dashboardApi.getDashboard(),
    }).subscribe({
      next: ({ levels, dashboard }) => {
        this.levels.set(levels);
        this.counts.set(dashboard.charts.studentsByLevel);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(httpErrorMessage(error, this.i18n.t('errors.connection')));
        this.loading.set(false);
      },
    });
  }

  band(level: Level): string {
    const rule = level.rules?.[0];
    return rule ? `${rule.minScore}–${rule.maxScore}` : level.code;
  }

  studentCount(level: Level): number {
    return this.counts()
      .filter((bucket) => bucket.key === level.code || bucket.key === `INTAKE_${level.code}`)
      .reduce((sum, bucket) => sum + bucket.count, 0);
  }
}
