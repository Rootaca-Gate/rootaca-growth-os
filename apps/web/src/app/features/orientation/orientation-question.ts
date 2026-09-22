import { Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { AssessmentAnswer, AssessmentQuestion, QuestionType } from './orientation.models';

const QUESTION_TYPE_KEYS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'orientation.multipleChoice',
  RATING: 'orientation.rating',
  MENTOR_EVALUATION: 'orientation.mentorEvaluation',
  PRACTICAL_EVALUATION: 'orientation.practicalEvaluation',
  FREE_TEXT: 'orientation.freeText',
};

@Component({
  selector: 'app-orientation-question',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatRadioModule, TPipe],
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
            <mat-label>{{ 'orientation.mentorScore' | t:{ max: question().maxScore } }}</mat-label>
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
            <mat-label>{{ 'orientation.practicalScore' | t:{ max: question().maxScore } }}</mat-label>
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
            <mat-label>{{ 'orientation.response' | t }}</mat-label>
            <textarea
              matInput
              rows="4"
              [ngModel]="answer()?.textValue ?? ''"
              [disabled]="readonly()"
              (ngModelChange)="onText($event)"
            ></textarea>
          </mat-form-field>
          @if (question().scored) {
            <div class="mentor-score">
              <p class="score-label">{{ 'orientation.mentorScore' | t:{ max: question().maxScore } }}</p>
              <div class="rating">
                @for (value of mentorScoreValues(); track value) {
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
            </div>
          }
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
      white-space: pre-wrap;
      line-height: 1.45;
    }

    .meta,
    .help {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.82rem;
      white-space: pre-wrap;
    }

    .help {
      margin-top: 6px;
    }

    .options {
      display: grid;
      gap: 8px;
    }

    .rating {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .rating-btn {
      min-width: 40px;
      height: 40px;
      padding: 0 10px;
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

    .mentor-score {
      margin-top: 8px;
    }

    .score-label {
      margin: 0 0 8px;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class OrientationQuestion {
  private readonly i18n = inject(DirectionService);
  readonly question = input.required<AssessmentQuestion>();
  readonly answer = input<AssessmentAnswer | undefined>(undefined);
  readonly readonly = input(false);
  readonly changed = output<AssessmentAnswer>();

  readonly typeLabel = computed(() => {
    this.i18n.locale();
    return this.i18n.t(QUESTION_TYPE_KEYS[this.question().type]);
  });
  readonly ratingValues = computed(() =>
    Array.from({ length: this.question().scaleMax }, (_, index) => index + 1),
  );
  readonly mentorScoreValues = computed(() =>
    Array.from({ length: this.question().maxScore + 1 }, (_, index) => index),
  );

  onOption(optionId: string): void {
    this.emit({ optionId });
  }

  onNumeric(value: number | string | null): void {
    const numericValue = value === null || value === '' ? null : Number(value);
    this.emit({
      numericValue: Number.isFinite(numericValue) ? numericValue : null,
    });
  }

  onText(textValue: string): void {
    this.emit({ textValue });
  }

  private emit(partial: Partial<AssessmentAnswer>): void {
    const current = this.answer();
    this.changed.emit({
      questionId: this.question().id,
      optionId: partial.optionId !== undefined ? partial.optionId : (current?.optionId ?? null),
      numericValue:
        partial.numericValue !== undefined ? partial.numericValue : (current?.numericValue ?? null),
      textValue: partial.textValue !== undefined ? partial.textValue : (current?.textValue ?? null),
      score: current?.score ?? null,
    });
  }
}
