import { Component, effect, inject, input, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { PlacementApi } from './placement.api';
import { SkillMatrix, SkillScoreView } from './skill-matrix';

@Component({
  selector: 'app-student-skills-panel',
  imports: [EmptyState, SkillMatrix, TPipe],
  template: `
    <section class="panel">
      @if (error(); as message) {
        <app-empty-state [title]="'students.skillsUnavailable' | t" [message]="message" />
      } @else {
        <app-skill-matrix [skills]="skills()" />
      }
    </section>
  `,
  styles: `
    .panel {
      padding: 8px 0 0;
    }
  `,
})
export class StudentSkillsPanel {
  private readonly api = inject(PlacementApi);
  readonly i18n = inject(DirectionService);
  readonly studentId = input.required<string>();
  readonly skills = signal<SkillScoreView[]>([]);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const studentId = this.studentId();
      forkJoin({
        catalog: this.api.listSkills(),
        scores: this.api.getStudentSkills(studentId),
      }).subscribe({
        next: ({ catalog, scores }) => {
          const byId = new Map(scores.map((skill) => [skill.skillId, skill.score]));
          this.skills.set(
            catalog.map((skill) => ({
              skillId: skill.id,
              name: skill.name,
              score: byId.has(skill.id) ? (byId.get(skill.id) as number) : null,
            })),
          );
          this.error.set(null);
        },
        error: () => this.error.set(this.i18n.t('catalogs.matrixError')),
      });
    });
  }
}
