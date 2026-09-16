import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeader } from '../../shared/page-header';
import { StudentForm } from './student-form';
import { StudentWritePayload } from './student.models';
import { StudentsApi } from './students.api';

@Component({
  selector: 'app-student-create-page',
  imports: [MatCardModule, PageHeader, StudentForm],
  template: `
    <app-page-header title="Create student" subtitle="Add a new student record" />
    <mat-card appearance="outlined">
      <mat-card-content>
        <app-student-form
          saveLabel="Create student"
          [submitting]="submitting()"
          (saved)="create($event)"
          (cancelled)="back()"
        />
      </mat-card-content>
    </mat-card>
  `,
})
export class StudentCreatePage {
  private readonly studentsApi = inject(StudentsApi);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly submitting = signal(false);

  create(payload: StudentWritePayload): void {
    this.submitting.set(true);
    this.studentsApi.create(payload).subscribe({
      next: (student) => {
        this.snackBar.open('Student created', 'OK', { duration: 2500 });
        void this.router.navigate(['/students', student.id]);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.snackBar.open(this.toErrorMessage(error), 'OK', { duration: 4000 });
      },
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
    return 'Unable to create student.';
  }
}
