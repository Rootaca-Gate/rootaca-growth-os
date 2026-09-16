import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import {
  ENGLISH_LEVELS,
  INTEREST_OPTIONS,
  LANGUAGE_OPTIONS,
  LEARNING_PATHS,
  PROGRAMMING_EXPERIENCE,
  STUDENT_LEVELS,
} from './student.labels';
import {
  Student,
  StudentWritePayload,
  EnglishLevel,
  LearningPath,
  ProgrammingExperience,
  StudentLevel,
} from './student.models';

@Component({
  selector: 'app-student-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    TPipe,
  ],
  templateUrl: './student-form.html',
  styleUrl: './student-form.scss',
})
export class StudentForm {
  private readonly formBuilder = inject(FormBuilder);
  readonly i18n = inject(DirectionService);

  readonly student = input<Student | null>(null);
  readonly submitting = input(false);
  readonly saveLabel = input('Save student');
  readonly wizard = input(false);
  readonly saved = output<StudentWritePayload>();
  readonly cancelled = output<void>();
  readonly step = signal(1);

  readonly languageOptions = LANGUAGE_OPTIONS;
  readonly interestOptions = INTEREST_OPTIONS;
  readonly experienceOptions = PROGRAMMING_EXPERIENCE;
  readonly englishOptions = ENGLISH_LEVELS;
  readonly levelOptions = STUDENT_LEVELS;
  readonly pathOptions = LEARNING_PATHS;

  readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    dateOfBirth: [null as Date | null, Validators.required],
    schoolGrade: ['', Validators.required],
    phone: ['', [Validators.required, Validators.minLength(8)]],
    parentContact: ['', [Validators.required, Validators.minLength(5)]],
    programmingExperience: this.formBuilder.nonNullable.control<ProgrammingExperience>('BEGINNER', {
      validators: [Validators.required],
    }),
    programmingLanguages: this.formBuilder.nonNullable.control<string[]>([]),
    interests: this.formBuilder.nonNullable.control<string[]>([]),
    learningGoal: ['', [Validators.required, Validators.minLength(8)]],
    availableHoursPerWeek: [4, [Validators.required, Validators.min(1), Validators.max(40)]],
    englishLevel: this.formBuilder.nonNullable.control<EnglishLevel>('INTERMEDIATE', {
      validators: [Validators.required],
    }),
    level: this.formBuilder.nonNullable.control<StudentLevel>('FOUNDATION', {
      validators: [Validators.required],
    }),
    path: this.formBuilder.nonNullable.control<LearningPath>('GENERAL', {
      validators: [Validators.required],
    }),
  });

  constructor() {
    effect(() => {
      const student = this.student();
      if (!student) {
        return;
      }

      this.form.patchValue({
        fullName: student.fullName,
        dateOfBirth: this.parseDate(student.dateOfBirth),
        schoolGrade: student.schoolGrade,
        phone: student.phone,
        parentContact: student.parentContact,
        programmingExperience: student.programmingExperience,
        programmingLanguages: student.programmingLanguages,
        interests: student.interests,
        learningGoal: student.learningGoal,
        availableHoursPerWeek: student.availableHoursPerWeek,
        englishLevel: student.englishLevel,
        level: student.level,
        path: student.path,
      });
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) {
      return;
    }

    const value = this.form.getRawValue();
    if (!value.dateOfBirth) {
      return;
    }

    this.saved.emit({
      fullName: value.fullName.trim(),
      dateOfBirth: this.formatDate(value.dateOfBirth),
      schoolGrade: value.schoolGrade.trim(),
      phone: value.phone.trim(),
      parentContact: value.parentContact.trim(),
      programmingExperience: value.programmingExperience,
      programmingLanguages: value.programmingLanguages,
      interests: value.interests,
      learningGoal: value.learningGoal.trim(),
      availableHoursPerWeek: Number(value.availableHoursPerWeek),
      englishLevel: value.englishLevel,
      level: value.level,
      path: value.path,
    });
  }

  continue(): void {
    if (!this.stepValid(this.step())) {
      this.markStepTouched(this.step());
      return;
    }
    this.step.update((current) => Math.min(3, current + 1));
  }

  back(): void {
    this.step.update((current) => Math.max(1, current - 1));
  }

  private stepValid(step: number): boolean {
    return this.stepControls(step).every((name) => this.form.controls[name].valid);
  }

  private markStepTouched(step: number): void {
    for (const name of this.stepControls(step)) {
      this.form.controls[name].markAsTouched();
    }
  }

  private stepControls(step: number): Array<keyof typeof this.form.controls> {
    if (step === 1) {
      return ['fullName', 'dateOfBirth', 'schoolGrade', 'phone', 'parentContact'];
    }
    if (step === 2) {
      return [
        'availableHoursPerWeek',
        'programmingExperience',
        'englishLevel',
        'programmingLanguages',
        'interests',
      ];
    }
    return ['level', 'path', 'learningGoal'];
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year ?? 2000, (month ?? 1) - 1, day ?? 1);
  }

  private formatDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
