import { Component, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';
import { PlacementApi } from './placement.api';
import { Level } from './placement.models';

@Component({
  selector: 'app-levels-page',
  imports: [MatProgressSpinnerModule, PageHeader, EmptyState],
  template: `
    <app-page-header
      title="Levels"
      subtitle="Score bands are stored as LevelRule rows and used after each assessment"
    />

    @if (loading()) {
      <div class="loading"><mat-spinner diameter="36" /></div>
    } @else if (levels().length === 0) {
      <app-empty-state title="No levels" message="Seed the placement catalog to load default bands." />
    } @else {
      <div class="grid">
        @for (level of levels(); track level.id) {
          <article>
            <p class="kicker">{{ band(level) }}</p>
            <h2>{{ level.name }}</h2>
            <p>{{ level.description }}</p>
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
  `,
})
export class LevelsPage {
  private readonly api = inject(PlacementApi);
  readonly loading = signal(true);
  readonly levels = signal<Level[]>([]);

  constructor() {
    this.api.listLevels().subscribe({
      next: (levels) => {
        this.levels.set(levels);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  band(level: Level): string {
    const rule = level.rules?.[0];
    return rule ? `${rule.minScore}–${rule.maxScore}` : level.code;
  }
}
