import { Component, computed, inject, input } from '@angular/core';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { Student } from './student.models';
import { StatusChip } from '../../shared/status-chip';

@Component({
  selector: 'app-student-overview',
  imports: [StatusChip, TPipe],
  template: `
    @if (student(); as current) {
      <dl class="details">
        <div>
          <dt>{{ 'students.fullName' | t }}</dt>
          <dd>{{ current.fullName }}</dd>
        </div>
        <div>
          <dt>{{ 'common.status' | t }}</dt>
          <dd><app-status-chip [status]="current.status" /></dd>
        </div>
        <div>
          <dt>{{ 'students.dateOfBirth' | t }}</dt>
          <dd>{{ current.dateOfBirth }}</dd>
        </div>
        <div>
          <dt>{{ 'students.schoolGrade' | t }}</dt>
          <dd>{{ current.schoolGrade }}</dd>
        </div>
        <div>
          <dt>{{ 'students.phone' | t }}</dt>
          <dd>{{ current.phone }}</dd>
        </div>
        <div>
          <dt>{{ 'students.parentContact' | t }}</dt>
          <dd>{{ current.parentContact }}</dd>
        </div>
        <div>
          <dt>{{ 'students.currentLevel' | t }}</dt>
          <dd>{{ currentLevelLabel() }}</dd>
        </div>
        <div>
          <dt>{{ 'students.recommendedPath' | t }}</dt>
          <dd>{{ currentPathLabel() }}</dd>
        </div>
        <div>
          <dt>{{ 'students.intakePath' | t }}</dt>
          <dd>{{ pathLabel() }}</dd>
        </div>
        <div>
          <dt>{{ 'students.intakeLevel' | t }}</dt>
          <dd>{{ levelLabel() }}</dd>
        </div>
        <div>
          <dt>{{ 'students.english' | t }}</dt>
          <dd>{{ englishLabel() }}</dd>
        </div>
        <div>
          <dt>{{ 'students.experience' | t }}</dt>
          <dd>{{ experienceLabel() }}</dd>
        </div>
        <div>
          <dt>{{ 'students.hoursWeek' | t }}</dt>
          <dd>{{ current.availableHoursPerWeek }}</dd>
        </div>
        <div>
          <dt>{{ 'students.languages' | t }}</dt>
          <dd>{{ current.programmingLanguages.join(', ') || '—' }}</dd>
        </div>
        <div class="span-2">
          <dt>{{ 'students.interests' | t }}</dt>
          <dd>{{ interestText() }}</dd>
        </div>
        <div class="span-2">
          <dt>{{ 'students.learningGoal' | t }}</dt>
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
  readonly i18n = inject(DirectionService);
  readonly student = input.required<Student>();
  readonly pathLabel = computed(() => {
    this.i18n.locale();
    return this.i18n.pathLabel(this.student().path);
  });
  readonly levelLabel = computed(() => {
    this.i18n.locale();
    return this.i18n.levelLabel(this.student().level);
  });
  readonly currentLevelLabel = computed(() => {
    this.i18n.locale();
    const name = this.student().currentLevel?.name;
    return name ? this.i18n.namedLevel(name) : this.i18n.t('students.notCalculated');
  });
  readonly currentPathLabel = computed(() => {
    this.i18n.locale();
    const name = this.student().currentPath?.name;
    return name ? this.i18n.namedPath(name) : this.i18n.t('students.notRecommended');
  });
  readonly englishLabel = computed(() => {
    this.i18n.locale();
    return this.i18n.englishLabel(this.student().englishLevel);
  });
  readonly experienceLabel = computed(() => {
    this.i18n.locale();
    return this.i18n.experienceLabel(this.student().programmingExperience);
  });
  readonly interestText = computed(() => {
    this.i18n.locale();
    const items = this.student().interests.map((item) => this.i18n.interestLabel(item));
    return items.join(' · ') || '—';
  });
}
