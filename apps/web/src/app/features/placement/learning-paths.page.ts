import { Component, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';
import { PlacementApi } from './placement.api';
import { LearningPath } from './placement.models';

@Component({
  selector: 'app-learning-paths-page',
  imports: [MatProgressSpinnerModule, PageHeader, EmptyState],
  template: `
    <app-page-header
      title="Learning paths"
      subtitle="Deterministic recommendations use interests, goal, assessment, skills, and experience"
    />

    @if (loading()) {
      <div class="loading"><mat-spinner diameter="36" /></div>
    } @else if (paths().length === 0) {
      <app-empty-state title="No paths" message="Seed the placement catalog to load learning paths." />
    } @else {
      <div class="grid">
        @for (path of paths(); track path.id) {
          <article>
            <h2>{{ path.name }}</h2>
            <p>{{ path.description }}</p>
            @if (path.skills?.length) {
              <ul>
                @for (skill of path.skills; track skill.skillId) {
                  <li>{{ skill.skillName }} · {{ skill.weightPercent }}%</li>
                }
              </ul>
            }
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
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    article {
      padding: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      background: var(--mat-sys-surface-container-lowest);
    }

    h2 {
      margin: 0 0 8px;
      font-size: 1.2rem;
    }

    p,
    li {
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.5;
    }

    p {
      margin: 0 0 12px;
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 6px;
    }
  `,
})
export class LearningPathsPage {
  private readonly api = inject(PlacementApi);
  readonly loading = signal(true);
  readonly paths = signal<LearningPath[]>([]);

  constructor() {
    this.api.listPaths().subscribe({
      next: (paths) => {
        this.paths.set(paths);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
