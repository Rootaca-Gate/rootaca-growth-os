import { Component, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  DIMENSION_KEYS,
  DIMENSION_LABELS,
  REVIEW_KIND_LABELS,
  REVIEW_KINDS,
} from './progress.labels';
import { ReviewKind, UpsertProgressReview } from './progress.models';

@Component({
  selector: 'app-mentor-review-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <header>
        <p class="kicker">Mentor review</p>
        <h2>Record progress</h2>
        <p>Score Technical Skills, Problem Solving, Projects, Independence, and Communication.</p>
      </header>
      <div class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Review type</mat-label>
          <mat-select formControlName="kind">
            @for (kind of kinds; track kind) {
              <mat-option [value]="kind">{{ kindLabels[kind] }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Review date</mat-label>
          <input matInput type="date" formControlName="reviewedAt" />
        </mat-form-field>
      </div>
      <div class="scores">
        @for (key of dimensions; track key) {
          <mat-form-field appearance="outline">
            <mat-label>{{ labels[key] }}</mat-label>
            <input matInput type="number" min="0" max="100" [formControlName]="key" />
          </mat-form-field>
        }
      </div>
      <mat-form-field appearance="outline">
        <mat-label>Strengths</mat-label>
        <textarea matInput rows="2" formControlName="strengths"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Next focus</mat-label>
        <textarea matInput rows="2" formControlName="nextFocus"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Notes</mat-label>
        <textarea matInput rows="3" formControlName="notes"></textarea>
      </mat-form-field>
      <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
        Save review
      </button>
    </form>
  `,
  styles: `
    form {
      display: grid;
      gap: 12px;
      padding: 20px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container-low);
    }

    header {
      display: grid;
      gap: 4px;
    }

    .kicker {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
      color: var(--mat-sys-on-surface-variant);
    }

    h2,
    p {
      margin: 0;
    }

    p {
      color: var(--mat-sys-on-surface-variant);
    }

    .grid,
    .scores {
      display: grid;
      gap: 12px;
    }

    .grid {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }

    .scores {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }
  `,
})
export class MentorReviewForm {
  readonly saved = output<UpsertProgressReview>();
  readonly kinds = REVIEW_KINDS;
  readonly kindLabels = REVIEW_KIND_LABELS;
  readonly dimensions = DIMENSION_KEYS;
  readonly labels = DIMENSION_LABELS;
  readonly form = new FormGroup({
    kind: new FormControl<ReviewKind>('INITIAL_ASSESSMENT', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    reviewedAt: new FormControl(new Date().toISOString().slice(0, 10), { nonNullable: true }),
    technicalSkills: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(100)],
    }),
    problemSolving: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(100)],
    }),
    projects: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(100)],
    }),
    independence: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(100)],
    }),
    communication: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(100)],
    }),
    strengths: new FormControl('', { nonNullable: true }),
    nextFocus: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    this.saved.emit({
      ...value,
      reviewedAt: value.reviewedAt || undefined,
    });
  }
}
