import { Component, effect, inject, input, signal } from '@angular/core';
import { EmptyState } from '../../shared/empty-state';
import { PlacementApi } from './placement.api';
import { StudentSkill } from './placement.models';
import { SkillMatrix } from './skill-matrix';

@Component({
  selector: 'app-student-skills-panel',
  imports: [EmptyState, SkillMatrix],
  template: `
    <section class="panel">
      <h2>Skill matrix</h2>
      @if (error(); as message) {
        <app-empty-state title="Skills unavailable" [message]="message" />
      } @else {
        <app-skill-matrix [skills]="skills()" />
      }
    </section>
  `,
  styles: `
    .panel {
      padding: 24px 8px 8px;
    }

    h2 {
      margin: 0 0 16px;
      font-size: 1.15rem;
    }
  `,
})
export class StudentSkillsPanel {
  private readonly api = inject(PlacementApi);
  readonly studentId = input.required<string>();
  readonly skills = signal<StudentSkill[]>([]);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const studentId = this.studentId();
      this.api.getStudentSkills(studentId).subscribe({
        next: (skills) => {
          this.skills.set(skills);
          this.error.set(null);
        },
        error: () => this.error.set('Unable to load the skill matrix.'),
      });
    });
  }
}
