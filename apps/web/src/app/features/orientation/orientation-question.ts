import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { QUESTION_TYPE_LABELS } from './orientation.labels';
import { AssessmentAnswer, AssessmentQuestion } from './orientation.models';

@Component({
  selector: 'app-orientation-question',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatRadioModule],
  template: `
    <article class="question">
      <header>
        <p class="meta">{{ typeLabel() }} · {{ question().categoryName }}</p>
        <h3>{{ question().prompt }}</h3>
        @if (question().helperText) {
          <p class="help">{{ question().helperText }}</p>
        }
      </header>

      @switch (question().type) {
        @case ('MULTIPLE_CHOICE') {
          <mat-radio-group
            class="options"
            [ngModel]="answer()?.optionId ?? null"
            [disabled]="readonly()"
            (ngModelChange)="onOption($event)"
          >
            @for (option of question().options; track option.id) {
              <mat-radio-button [value]="option.id">{{ option.label }}</mat-radio-button>
            }
          </mat-radio-group>
        }
        @case ('RATING') {
          <div class="rating">
            @for (value of ratingValues(); track value) {
              <button
                type="button"
                class="rating-btn"
                [class.active]="answer()?.numericValue === value"
                [disabled]="readonly()"
                (click)="onNumeric(value)"
              >
                {{ value }}
              </button>
            }
          </div>
        }
        @case ('MENTOR_EVALUATION') {
          <mat-form-field appearance="outline">
            <mat-label>Mentor score (0–{{ question().maxScore }})</mat-label>
            <input
              matInput
              type="number"
              [min]="0"
              [max]="question().maxScore"
              [ngModel]="answer()?.numericValue ?? null"
              [disabled]="readonly()"
              (ngModelChange)="onNumeric($event)"
            />
          </mat-form-field>
        }
        @case ('PRACTICAL_EVALUATION') {
          <mat-form-field appearance="outline">
            <mat-label>Practical score (0–{{ question().maxScore }})</mat-label>
            <input
              matInput
              type="number"
              [min]="0"
              [max]="question().maxScore"
              [ngModel]="answer()?.numericValue ?? null"
              [disabled]="readonly()"
              (ngModelChange)="onNumeric($event)"
            />
          </mat-form-field>
        }
        @case ('FREE_TEXT') {
          <mat-form-field appearance="outline" class="full">
            <mat-label>Response</mat-label>
            <textarea
              matInput
              rows="4"
              [ngModel]="answer()?.textValue ?? ''"
              [disabled]="readonly()"
              (ngModelChange)="onText($event)"
            ></textarea>
          </mat-form-field>
        }
      }
    </article>
  `,
  styles: `
    .question {
      padding: 16px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    h3 {
      margin: 4px 0 8px;
      font-size: 1.05rem;
      font-weight: 600;
    }

    .meta,
    .help {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.82rem;
    }

    .options {
      display: grid;
      gap: 8px;
    }

    .rating {
      display: flex;
      gap: 8px;
    }

    .rating-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: transparent;
      cursor: pointer;
    }

    .rating-btn.active {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      border-color: transparent;
    }

    .full {
      width: 100%;
    }
  `,
})
export class OrientationQuestion {
  readonly question = input.required<AssessmentQuestion>();
  readonly answer = input<AssessmentAnswer | undefined>(undefined);
  readonly readonly = input(false);
  readonly changed = output<AssessmentAnswer>();

  readonly typeLabel = computed(() => QUESTION_TYPE_LABELS[this.question().type]);
  readonly ratingValues = computed(() =>
    Array.from({ length: this.question().scaleMax }, (_, index) => index + 1),
  );

  onOption(optionId: string): void {
    this.changed.emit({ questionId: this.question().id, optionId });
  }

  onNumeric(value: number | string | null): void {
    const numericValue = value === null || value === '' ? null : Number(value);
    this.changed.emit({
      questionId: this.question().id,
      numericValue: Number.isFinite(numericValue) ? numericValue : null,
    });
  }

  onText(textValue: string): void {
    this.changed.emit({ questionId: this.question().id, textValue });
  }
}
