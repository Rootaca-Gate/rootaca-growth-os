import { Component, input } from '@angular/core';
import { StudentSkill } from './placement.models';

@Component({
  selector: 'app-skill-matrix',
  template: `
    @if (skills().length === 0) {
      <p class="empty">Skill scores appear after the orientation assessment is completed.</p>
    } @else {
      <ul>
        @for (skill of skills(); track skill.skillId) {
          <li>
            <div class="meta">
              <strong>{{ skill.name }}</strong>
              <span>{{ skill.score }}</span>
            </div>
            <div class="bar" [style.--value]="skill.score + '%'">
              <span></span>
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .empty {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
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
      background: var(--mat-sys-primary);
    }
  `,
})
export class SkillMatrix {
  readonly skills = input.required<StudentSkill[]>();
}
