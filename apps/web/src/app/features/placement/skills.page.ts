import { Component, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';
import { PlacementApi } from './placement.api';
import { Skill } from './placement.models';

@Component({
  selector: 'app-skills-page',
  imports: [MatProgressSpinnerModule, PageHeader, EmptyState],
  template: `
    <app-page-header
      title="Skills"
      subtitle="Ten skills calculated from the orientation assessment, then stored per student"
    />

    @if (loading()) {
      <div class="loading"><mat-spinner diameter="36" /></div>
    } @else if (skills().length === 0) {
      <app-empty-state title="No skills" message="Seed the placement catalog to load the skill list." />
    } @else {
      <ol>
        @for (skill of skills(); track skill.id) {
          <li>
            <strong>{{ skill.name }}</strong>
            <span>{{ skill.description }}</span>
          </li>
        }
      </ol>
    }
  `,
  styles: `
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }

    ol {
      display: grid;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: grid;
      gap: 4px;
      padding: 16px 18px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 14px;
      background: var(--mat-sys-surface-container-lowest);
    }

    span {
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.5;
    }
  `,
})
export class SkillsPage {
  private readonly api = inject(PlacementApi);
  readonly loading = signal(true);
  readonly skills = signal<Skill[]>([]);

  constructor() {
    this.api.listSkills().subscribe({
      next: (skills) => {
        this.skills.set(skills);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
