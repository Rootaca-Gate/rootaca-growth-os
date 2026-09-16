import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { PageHeader } from '../../shared/page-header';
import { httpErrorMessage } from '../../shared/http-error';
import { PlacementApi } from './placement.api';
import { LearningPath, Skill } from './placement.models';

@Component({
  selector: 'app-skills-page',
  imports: [MatProgressSpinnerModule, PageHeader, EmptyState, ErrorState, TPipe],
  template: `
    <app-page-header
      [title]="'catalogs.skillsTitle' | t"
      [subtitle]="'catalogs.skillsSubtitle' | t"
    />

    @if (loading()) {
      <div class="loading"><mat-spinner diameter="36" /></div>
    } @else if (error(); as message) {
      <app-error-state [title]="'catalogs.skillsError' | t" [message]="message" (retry)="load()" />
    } @else if (skills().length === 0) {
      <app-empty-state [title]="'catalogs.noSkills' | t" [message]="'catalogs.noSkillsHint' | t" />
    } @else {
      <ol>
        @for (skill of skills(); track skill.id) {
          <li>
            <strong>{{ skill.name }}</strong>
            <span>{{ skill.description }}</span>
            @if (usedIn(skill.id); as paths) {
              <p class="usage">{{ 'catalogs.usedIn' | t:{ paths } }}</p>
            }
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

    span,
    .usage {
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.5;
    }

    .usage {
      margin: 6px 0 0;
      font-size: 0.88rem;
    }
  `,
})
export class SkillsPage {
  private readonly api = inject(PlacementApi);
  readonly i18n = inject(DirectionService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly skills = signal<Skill[]>([]);
  readonly paths = signal<LearningPath[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      skills: this.api.listSkills(),
      paths: this.api.listPaths(),
    }).subscribe({
      next: ({ skills, paths }) => {
        this.skills.set(skills);
        this.paths.set(paths);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(httpErrorMessage(error, this.i18n.t('errors.connection')));
        this.loading.set(false);
      },
    });
  }

  usedIn(skillId: string): string | null {
    const names = this.paths()
      .filter((path) => path.skills?.some((skill) => skill.skillId === skillId))
      .map((path) => path.name);
    return names.length ? names.join(' · ') : null;
  }
}
