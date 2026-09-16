import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { EmptyState } from '../../shared/empty-state';
import { PathRecommendationCard } from './path-recommendation-card';
import { PlacementApi } from './placement.api';
import { LearningPath, Level, Placement } from './placement.models';

@Component({
  selector: 'app-student-roadmap-panel',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    EmptyState,
    PathRecommendationCard,
  ],
  template: `
    <section class="panel">
      <h2>Path recommendation</h2>
      @if (error(); as message) {
        <app-empty-state title="No placement yet" [message]="message" />
      } @else if (placement(); as current) {
        <div class="level">
          <p class="kicker">Current level</p>
          <h3>{{ current.finalLevel.name }}</h3>
          <p>
            System result {{ current.systemLevel.name }}
            @if (current.levelChangedBy) {
              · overridden by {{ current.levelChangedBy.displayName }}
            }
          </p>
        </div>
        <app-path-recommendation-card [placement]="current" />

        <div class="overrides">
          <form [formGroup]="levelForm" (ngSubmit)="saveLevel()">
            <h3>Override level</h3>
            <mat-form-field appearance="outline">
              <mat-label>Level</mat-label>
              <mat-select formControlName="levelId">
                @for (level of levels(); track level.id) {
                  <mat-option [value]="level.id">{{ level.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Reason</mat-label>
              <textarea matInput rows="3" formControlName="reason"></textarea>
            </mat-form-field>
            <button mat-stroked-button type="submit" [disabled]="levelForm.invalid || saving()">
              Save level override
            </button>
          </form>

          <form [formGroup]="pathForm" (ngSubmit)="savePath()">
            <h3>Override path</h3>
            <mat-form-field appearance="outline">
              <mat-label>Path</mat-label>
              <mat-select formControlName="pathId">
                @for (path of paths(); track path.id) {
                  <mat-option [value]="path.id">{{ path.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Reason</mat-label>
              <textarea matInput rows="3" formControlName="reason"></textarea>
            </mat-form-field>
            <button mat-stroked-button type="submit" [disabled]="pathForm.invalid || saving()">
              Save path override
            </button>
          </form>
        </div>
      }
    </section>
  `,
  styles: `
    .panel {
      padding: 24px 8px 8px;
      display: grid;
      gap: 20px;
    }

    h2,
    h3,
    p {
      margin: 0;
    }

    .kicker {
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .level p {
      margin-top: 6px;
      color: var(--mat-sys-on-surface-variant);
    }

    .overrides {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    form {
      display: grid;
      gap: 8px;
      padding: 16px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
    }

    @media (max-width: 800px) {
      .overrides {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class StudentRoadmapPanel {
  private readonly api = inject(PlacementApi);
  private readonly snackBar = inject(MatSnackBar);

  readonly studentId = input.required<string>();
  readonly placement = signal<Placement | null>(null);
  readonly levels = signal<Level[]>([]);
  readonly paths = signal<LearningPath[]>([]);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

  readonly levelForm = new FormGroup({
    levelId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    reason: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  readonly pathForm = new FormGroup({
    pathId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    reason: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  constructor() {
    effect(() => {
      const studentId = this.studentId();
      forkJoin({
        placement: this.api.getPlacement(studentId),
        levels: this.api.listLevels(),
        paths: this.api.listPaths(),
      }).subscribe({
        next: ({ placement, levels, paths }) => {
          this.hydrate(placement, levels, paths);
          this.error.set(null);
        },
        error: (error: unknown) => {
          this.placement.set(null);
          this.error.set(this.toErrorMessage(error));
        },
      });
    });
  }

  saveLevel(): void {
    if (this.levelForm.invalid) {
      return;
    }
    this.saving.set(true);
    const value = this.levelForm.getRawValue();
    this.api.overrideLevel(this.studentId(), value.levelId, value.reason).subscribe({
      next: (placement) => {
        this.placement.set(placement);
        this.levelForm.controls.reason.reset('');
        this.saving.set(false);
        this.snackBar.open('Level override saved', 'OK', { duration: 2500 });
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.snackBar.open(this.toErrorMessage(error), 'OK', { duration: 4000 });
      },
    });
  }

  savePath(): void {
    if (this.pathForm.invalid) {
      return;
    }
    this.saving.set(true);
    const value = this.pathForm.getRawValue();
    this.api.overridePath(this.studentId(), value.pathId, value.reason).subscribe({
      next: (placement) => {
        this.placement.set(placement);
        this.pathForm.controls.reason.reset('');
        this.saving.set(false);
        this.snackBar.open('Path override saved', 'OK', { duration: 2500 });
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.snackBar.open(this.toErrorMessage(error), 'OK', { duration: 4000 });
      },
    });
  }

  private hydrate(placement: Placement, levels: Level[], paths: LearningPath[]): void {
    this.placement.set(placement);
    this.levels.set(levels);
    this.paths.set(paths);
    this.levelForm.patchValue({ levelId: placement.finalLevel.id }, { emitEvent: false });
    this.pathForm.patchValue({ pathId: placement.finalPath.id }, { emitEvent: false });
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        return 'Complete the 20-minute orientation to calculate level, skills, and a path.';
      }
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }
    }
    return 'Unable to load the path recommendation.';
  }
}
