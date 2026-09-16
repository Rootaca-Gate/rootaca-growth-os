import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { PageHeader } from '../../shared/page-header';
import { httpErrorMessage } from '../../shared/http-error';
import { StudentsApi } from '../students/students.api';
import { Student } from '../students/student.models';
import { PlacementApi } from './placement.api';
import { LearningPath, Placement } from './placement.models';

@Component({
  selector: 'app-learning-paths-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    PageHeader,
    EmptyState,
    ErrorState,
    TPipe,
  ],
  template: `
    <app-page-header
      [title]="'catalogs.pathsTitle' | t"
      [subtitle]="'catalogs.pathsSubtitle' | t"
    />

    @if (loading()) {
      <div class="loading"><mat-spinner diameter="36" /></div>
    } @else if (error(); as message) {
      <app-error-state [title]="'catalogs.pathsError' | t" [message]="message" (retry)="load()" />
    } @else if (paths().length === 0) {
      <app-empty-state [title]="'catalogs.noPaths' | t" [message]="'catalogs.noPathsHint' | t" />
    } @else {
      <section class="ra-card explain">
        <h2>{{ 'catalogs.howTitle' | t }}</h2>
        <p>{{ 'catalogs.howIntro' | t }}</p>
        <ul>
          <li>{{ 'catalogs.interests' | t }}</li>
          <li>{{ 'catalogs.learningGoal' | t }}</li>
          <li>{{ 'catalogs.assessment' | t }}</li>
          <li>{{ 'catalogs.skills' | t }}</li>
          <li>{{ 'catalogs.experience' | t }}</li>
        </ul>
      </section>

      <section class="ra-card preview">
        <h2>{{ 'catalogs.testTitle' | t }}</h2>
        <p>{{ 'catalogs.testHint' | t }}</p>
        <div class="preview-row">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'common.student' | t }}</mat-label>
            <mat-select [(ngModel)]="selectedStudentId">
              @for (student of students(); track student.id) {
                <mat-option [value]="student.id">{{ student.fullName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button
            mat-flat-button
            color="primary"
            type="button"
            [disabled]="!selectedStudentId || previewing()"
            (click)="preview()"
          >
            {{ 'catalogs.showRecommendation' | t }}
          </button>
        </div>
        @if (previewError(); as message) {
          <p class="quiet">{{ message }}</p>
        } @else if (placement(); as current) {
          <p class="kicker">{{ 'catalogs.recommendedPath' | t }}</p>
          <h3>{{ current.finalPath.name }}</h3>
          @if (current.recommendationReasons.length) {
            <p class="kicker">{{ 'catalogs.mainFactors' | t }}</p>
            <ul>
              @for (reason of current.recommendationReasons; track reason) {
                <li>{{ reason }}</li>
              }
            </ul>
          }
        }
      </section>

      <div class="grid">
        @for (path of paths(); track path.id) {
          <article>
            <h2>{{ path.name }}</h2>
            <p>{{ path.description }}</p>
            @if (path.skills?.length) {
              <p class="kicker">{{ 'catalogs.factors' | t }}</p>
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

    .explain,
    .preview,
    article {
      padding: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      background: var(--mat-sys-surface-container-lowest);
      margin-block-end: 16px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    h2 {
      margin: 0 0 8px;
      font-size: 1.2rem;
    }

    h3 {
      margin: 0 0 12px;
      font-size: 1.35rem;
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

    .kicker {
      margin: 0 0 6px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .preview-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      margin-block-end: 12px;
    }

    .quiet {
      margin: 0;
    }
  `,
})
export class LearningPathsPage {
  private readonly api = inject(PlacementApi);
  private readonly studentsApi = inject(StudentsApi);
  readonly i18n = inject(DirectionService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly paths = signal<LearningPath[]>([]);
  readonly students = signal<Student[]>([]);
  readonly previewing = signal(false);
  readonly previewError = signal<string | null>(null);
  readonly placement = signal<Placement | null>(null);
  selectedStudentId = '';

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      paths: this.api.listPaths(),
      students: this.studentsApi.list({ page: 1, pageSize: 100, sortBy: 'fullName', sortOrder: 'asc' }),
    }).subscribe({
      next: ({ paths, students }) => {
        this.paths.set(paths);
        this.students.set(students.items);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(httpErrorMessage(error, this.i18n.t('errors.connection')));
        this.loading.set(false);
      },
    });
  }

  preview(): void {
    if (!this.selectedStudentId) {
      return;
    }
    this.previewing.set(true);
    this.previewError.set(null);
    this.placement.set(null);
    this.api.getPlacement(this.selectedStudentId).subscribe({
      next: (placement) => {
        this.placement.set(placement);
        this.previewing.set(false);
      },
      error: (error: unknown) => {
        this.previewing.set(false);
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.previewError.set(this.i18n.t('catalogs.completeOrientationFirst'));
          return;
        }
        this.previewError.set(httpErrorMessage(error, this.i18n.t('catalogs.recommendationFailed')));
      },
    });
  }
}
