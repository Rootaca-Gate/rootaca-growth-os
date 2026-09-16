import { Component, input } from '@angular/core';

export type SkillScoreView = {
  skillId: string;
  name: string;
  score: number | null;
};

@Component({
  selector: 'app-skill-matrix',
  template: `
    @if (skills().length === 0) {
      <p class="empty">No skill scores yet. Skill scores will appear after completed assessments.</p>
    } @else {
      <ul>
        @for (skill of skills(); track skill.skillId) {
          <li>
            <div class="meta">
              <strong>{{ skill.name }}</strong>
              <span>{{ skill.score === null ? 'Not assessed' : skill.score }}</span>
            </div>
            <div class="bar" [style.--value]="(skill.score ?? 0) + '%'">
              <span [class.empty-fill]="skill.score === null"></span>
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .empty {
      margin: 0;
      color: var(--ra-muted);
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 12px;
    }

    .meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
      font-size: 0.92rem;
    }

    .bar {
      height: 8px;
      border-radius: 999px;
      background: var(--mat-sys-surface-container-high);
      overflow: hidden;
    }

    .bar span {
      display: block;
      width: var(--value);
      height: 100%;
      border-radius: inherit;
      background: var(--ra-accent);
    }

    .empty-fill {
      width: 0 !important;
    }
  `,
})
export class SkillMatrix {
  readonly skills = input.required<SkillScoreView[]>();
}
