import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { PageHeader } from '../../shared/page-header';
import { StudentForm } from './student-form';
import { Student, StudentWritePayload } from './student.models';
import { StudentsApi } from './students.api';
import { OrientationApi } from '../orientation/orientation.api';

@Component({
  selector: 'app-student-create-page',
  imports: [MatCardModule, MatButtonModule, PageHeader, StudentForm, RouterLink, TPipe],
  template: `
    <app-page-header [title]="'students.createTitle' | t" [subtitle]="'students.createSubtitle' | t" />
    @if (created(); as student) {
      <section class="ra-card success">
        <h2>{{ 'students.createdTitle' | t }}</h2>
        <p>{{ i18n.t('students.createdMessage', { name: student.fullName }) }}</p>
        <div class="actions">
          <a mat-flat-button color="primary" [routerLink]="['/students', student.id]">{{ 'students.viewStudent' | t }}</a>
          <button mat-stroked-button type="button" (click)="startOrientation(student.id)">{{ 'students.startOrientation' | t }}</button>
        </div>
      </section>
    } @else {
      <mat-card appearance="outlined">
        <mat-card-content>
          <app-student-form
            [saveLabel]="'students.createStudent' | t"
            [wizard]="true"
            [submitting]="submitting()"
            (saved)="create($event)"
            (cancelled)="back()"
          />
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: `
    .success {
      padding: 28px;
    }
    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  `,
})
export class StudentCreatePage {
  private readonly studentsApi = inject(StudentsApi);
  private readonly orientationApi = inject(OrientationApi);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);
  readonly submitting = signal(false);
  readonly created = signal<Student | null>(null);

  create(payload: StudentWritePayload): void {
    this.submitting.set(true);
    this.studentsApi.create(payload).subscribe({
      next: (student) => {
        this.created.set(student);
        this.submitting.set(false);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.snackBar.open(this.toErrorMessage(error), this.i18n.t('common.ok'), { duration: 4000 });
      },
    });
  }

  startOrientation(studentId: string): void {
    this.orientationApi.create(studentId).subscribe({
      next: (session) => {
        void this.router.navigate(['/students', studentId, 'orientation', session.id]);
      },
      error: () =>
        this.snackBar.open(this.i18n.t('students.orientationFailed'), this.i18n.t('common.ok'), {
          duration: 3000,
        }),
    });
  }

  back(): void {
    void this.router.navigateByUrl('/students');
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && Array.isArray(error.error?.message)) {
      return error.error.message.join(', ');
    }
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return this.i18n.t('students.createFailed');
  }
}
