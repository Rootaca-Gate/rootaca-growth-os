import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { interval } from 'rxjs';
import { PageHeader } from '../../shared/page-header';
import { AssessmentResultCard } from './assessment-result-card';
import { OrientationQuestion } from './orientation-question';
import { OrientationTimer } from './orientation-timer';
import { OrientationApi } from './orientation.api';
import { ORIENTATION_STAGES, STAGE_META } from './orientation.labels';
import {
  AnswerPayload,
  AssessmentAnswer,
  AssessmentQuestion,
  OrientationSession,
  OrientationStage,
} from './orientation.models';

@Component({
  selector: 'app-orientation-wizard-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    PageHeader,
    OrientationTimer,
    OrientationQuestion,
    AssessmentResultCard,
  ],
  templateUrl: './orientation-wizard.page.html',
  styleUrl: './orientation-wizard.page.scss',
})
export class OrientationWizardPage {
  private readonly orientationApi = inject(OrientationApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly session = signal<OrientationSession | null>(null);
  readonly answers = signal<Record<string, AssessmentAnswer>>({});
  readonly elapsedMs = signal(0);
  readonly stages = ORIENTATION_STAGES;
  readonly stageMeta = STAGE_META;
  readonly notesControl = new FormControl('', { nonNullable: true });

  readonly readonly = computed(() => this.session()?.status === 'COMPLETED');
  readonly currentQuestions = computed(() => {
    const session = this.session();
    if (!session) {
      return [];
    }
    return session.questions.filter((question) => question.stage === session.currentStage);
  });
  readonly answeredCount = computed(() => {
    const session = this.session();
    if (!session) {
      return 0;
    }
    return session.questions.filter((question) =>
      this.hasAnswer(question, this.answers()[question.id]),
    ).length;
  });
  readonly progress = computed(() => {
    const total = this.session()?.questions.length ?? 0;
    return total === 0 ? 0 : Math.round((this.answeredCount() / total) * 100);
  });
  readonly stageIndex = computed(() => {
    const stage = this.session()?.currentStage;
    return stage ? ORIENTATION_STAGES.indexOf(stage) : 0;
  });

  constructor() {
    const sessionId = this.route.snapshot.paramMap.get('sessionId');
    if (!sessionId) {
      return;
    }

    this.orientationApi.get(sessionId).subscribe({
      next: (session) => this.hydrate(session),
      error: (error: unknown) => {
        this.loading.set(false);
        this.snackBar.open(this.toErrorMessage(error), 'OK', { duration: 4000 });
        void this.router.navigate(['/students']);
      },
    });

    interval(250)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.tick());
  }

  stageLabel(stage: OrientationStage): string {
    return `${STAGE_META[stage].window} ${STAGE_META[stage].label}`;
  }

  answerFor(questionId: string): AssessmentAnswer | undefined {
    return this.answers()[questionId];
  }

  setAnswer(answer: AssessmentAnswer): void {
    this.answers.update((current) => ({ ...current, [answer.questionId]: answer }));
  }

  goToStage(stage: OrientationStage): void {
    const session = this.session();
    if (!session || this.readonly()) {
      return;
    }
    this.session.set({ ...session, currentStage: stage });
  }

  previous(): void {
    const index = this.stageIndex();
    if (index > 0) {
      this.goToStage(ORIENTATION_STAGES[index - 1]);
    }
  }

  next(): void {
    const index = this.stageIndex();
    if (index < ORIENTATION_STAGES.length - 1) {
      this.goToStage(ORIENTATION_STAGES[index + 1]);
    }
  }

  start(): void {
    this.run((id) => this.orientationApi.start(id), 'Timer started');
  }

  pause(): void {
    this.run((id) => this.orientationApi.pause(id), 'Timer paused');
  }

  resume(): void {
    this.run((id) => this.orientationApi.resume(id), 'Timer resumed');
  }

  save(): void {
    const session = this.session();
    if (!session || this.readonly()) {
      return;
    }

    this.saving.set(true);
    this.orientationApi
      .save(session.id, {
        notes: this.notesControl.value,
        currentStage: session.currentStage,
        answers: this.payloads(),
      })
      .subscribe({
        next: (updated) => {
          this.hydrate(updated);
          this.saving.set(false);
          this.snackBar.open('Session saved', 'OK', { duration: 2000 });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.snackBar.open(this.toErrorMessage(error), 'OK', { duration: 4000 });
        },
      });
  }

  complete(): void {
    const session = this.session();
    if (!session || this.readonly()) {
      return;
    }

    this.saving.set(true);
    this.orientationApi
      .save(session.id, {
        notes: this.notesControl.value,
        currentStage: session.currentStage,
        answers: this.payloads(),
      })
      .subscribe({
        next: () => {
          this.orientationApi.complete(session.id).subscribe({
            next: (updated) => {
              this.hydrate(updated);
              this.saving.set(false);
              this.snackBar.open('Orientation completed', 'OK', { duration: 2500 });
            },
            error: (error: unknown) => {
              this.saving.set(false);
              this.snackBar.open(this.toErrorMessage(error), 'OK', { duration: 4000 });
            },
          });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.snackBar.open(this.toErrorMessage(error), 'OK', { duration: 4000 });
        },
      });
  }

  private run(action: (id: string) => ReturnType<OrientationApi['start']>, message: string): void {
    const session = this.session();
    if (!session) {
      return;
    }

    action(session.id).subscribe({
      next: (updated) => {
        this.hydrate(updated);
        this.snackBar.open(message, 'OK', { duration: 1800 });
      },
      error: (error: unknown) => {
        this.snackBar.open(this.toErrorMessage(error), 'OK', { duration: 4000 });
      },
    });
  }

  private hydrate(session: OrientationSession): void {
    this.session.set(session);
    this.notesControl.setValue(session.notes, { emitEvent: false });
    const answers: Record<string, AssessmentAnswer> = {};
    for (const answer of session.answers) {
      answers[answer.questionId] = answer;
    }
    this.answers.set(answers);
    this.elapsedMs.set(session.elapsedMs);
    this.loading.set(false);
    this.tick(session);
  }

  private tick(session = this.session()): void {
    if (!session) {
      return;
    }

    if (session.status === 'IN_PROGRESS' && session.lastResumedAt) {
      const extra = Date.now() - new Date(session.lastResumedAt).getTime();
      this.elapsedMs.set(session.elapsedMs + Math.max(0, extra));
      return;
    }

    this.elapsedMs.set(session.elapsedMs);
  }

  private payloads(): AnswerPayload[] {
    return Object.values(this.answers())
      .filter((answer) => this.hasAnswer(undefined, answer))
      .map((answer) => ({
        questionId: answer.questionId,
        ...(answer.optionId ? { optionId: answer.optionId } : {}),
        ...(answer.numericValue !== null && answer.numericValue !== undefined
          ? { numericValue: answer.numericValue }
          : {}),
        ...(answer.textValue ? { textValue: answer.textValue } : {}),
      }));
  }

  private hasAnswer(question: AssessmentQuestion | undefined, answer?: AssessmentAnswer): boolean {
    if (!answer) {
      return false;
    }
    if (question?.type === 'FREE_TEXT' || answer.textValue) {
      return Boolean(answer.textValue?.trim());
    }
    if (answer.optionId) {
      return true;
    }
    return answer.numericValue !== null && answer.numericValue !== undefined;
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'Unable to update the orientation session.';
  }
}
