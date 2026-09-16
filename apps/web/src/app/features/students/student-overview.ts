import { Component, computed, input } from '@angular/core';
import { ENGLISH_LABELS, EXPERIENCE_LABELS, LEVEL_LABELS, PATH_LABELS } from './student.labels';
import { Student } from './student.models';
import { StatusChip } from '../../shared/status-chip';

@Component({
  selector: 'app-student-overview',
  imports: [StatusChip],
  template: `
    @if (student(); as current) {
      <dl class="details">
        <div>
          <dt>Full name</dt>
          <dd>{{ current.fullName }}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd><app-status-chip [status]="current.status" /></dd>
        </div>
        <div>
          <dt>Date of birth</dt>
          <dd>{{ current.dateOfBirth }}</dd>
        </div>
        <div>
          <dt>School grade</dt>
          <dd>{{ current.schoolGrade }}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{{ current.phone }}</dd>
        </div>
        <div>
          <dt>Parent contact</dt>
          <dd>{{ current.parentContact }}</dd>
        </div>
        <div>
          <dt>Current level</dt>
          <dd>{{ currentLevelLabel() }}</dd>
        </div>
        <div>
          <dt>Recommended path</dt>
          <dd>{{ currentPathLabel() }}</dd>
        </div>
        <div>
          <dt>Intake path</dt>
          <dd>{{ pathLabel() }}</dd>
        </div>
        <div>
          <dt>Intake level</dt>
          <dd>{{ levelLabel() }}</dd>
        </div>
        <div>
          <dt>English</dt>
          <dd>{{ englishLabel() }}</dd>
        </div>
        <div>
          <dt>Experience</dt>
          <dd>{{ experienceLabel() }}</dd>
        </div>
        <div>
          <dt>Hours / week</dt>
          <dd>{{ current.availableHoursPerWeek }}</dd>
        </div>
        <div>
          <dt>Languages</dt>
          <dd>{{ current.programmingLanguages.join(', ') || '—' }}</dd>
        </div>
        <div class="span-2">
          <dt>Interests</dt>
          <dd>{{ current.interests.join(', ') || '—' }}</dd>
        </div>
        <div class="span-2">
          <dt>Learning goal</dt>
          <dd>{{ current.learningGoal }}</dd>
        </div>
      </dl>
    }
  `,
  styles: `
    .details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px 24px;
      margin: 8px 0 0;
    }

    dt {
      margin-bottom: 4px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.8rem;
    }

    dd {
      margin: 0;
      font-weight: 500;
    }

    .span-2 {
      grid-column: 1 / -1;
    }

    @media (max-width: 720px) {
      .details {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class StudentOverview {
  readonly student = input.required<Student>();
  readonly pathLabel = computed(() => PATH_LABELS[this.student().path]);
  readonly levelLabel = computed(() => LEVEL_LABELS[this.student().level]);
  readonly currentLevelLabel = computed(
    () => this.student().currentLevel?.name ?? 'Not calculated yet',
  );
  readonly currentPathLabel = computed(
    () => this.student().currentPath?.name ?? 'Not recommended yet',
  );
  readonly englishLabel = computed(() => ENGLISH_LABELS[this.student().englishLevel]);
  readonly experienceLabel = computed(
    () => EXPERIENCE_LABELS[this.student().programmingExperience],
  );
}
